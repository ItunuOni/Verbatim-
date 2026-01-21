import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Upload, 
  FileAudio, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Mic,
  Languages,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ProcessingStatus = 'idle' | 'uploading' | 'transcribing' | 'translating' | 'generating-voiceover' | 'complete' | 'error';

const emotions = [
  { id: 'neutral', label: 'Neutral', emoji: '😐' },
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'excited', label: 'Excited', emoji: '🎉' },
  { id: 'serious', label: 'Serious', emoji: '🎯' },
  { id: 'friendly', label: 'Friendly', emoji: '🤗' },
  { id: 'dramatic', label: 'Dramatic', emoji: '🎭' },
  { id: 'calm', label: 'Calm', emoji: '🧘' },
];

const languages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 
  'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Russian', 'Dutch', 'Polish', 'Turkish'
];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [voiceoverScript, setVoiceoverScript] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('neutral');
  const [activeTab, setActiveTab] = useState<'transcription' | 'voiceover'>('transcription');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is 500MB.`);
      return;
    }

    const validTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
      'video/mp4', 'video/webm', 'video/quicktime', 'audio/ogg', 'video/ogg'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|mp4|wav|m4a|aac|webm|mov|ogg)$/i)) {
      toast.error('Invalid file type. Please upload an audio or video file.');
      return;
    }

    setSelectedFile(file);
    setTranscription('');
    setVoiceoverScript('');
    setStatus('idle');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;

    try {
      setStatus('uploading');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (targetLanguage) {
        formData.append('targetLanguage', targetLanguage);
      }

      setStatus('transcribing');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const data = await response.json();
      
      if (targetLanguage) {
        setStatus('translating');
        // Brief visual feedback for translation status
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setTranscription(data.transcription);
      setStatus('complete');
      toast.success('Transcription complete!');

    } catch (error) {
      console.error('Processing error:', error);
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
    }
  };

  const generateVoiceover = async () => {
    if (!transcription) {
      toast.error('Please transcribe a file first');
      return;
    }

    try {
      setStatus('generating-voiceover');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-voiceover`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: transcription,
            emotion: selectedEmotion,
            language: targetLanguage || 'English',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Voice-over generation failed');
      }

      const data = await response.json();
      setVoiceoverScript(data.voiceoverScript);
      setActiveTab('voiceover');
      setStatus('complete');
      toast.success('Voice-over script generated!');

    } catch (error) {
      console.error('Voiceover error:', error);
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Failed to generate voice-over');
    }
  };

  const downloadSRT = () => {
    if (!transcription) return;

    // Convert transcription to SRT format
    const lines = transcription.split('\n').filter(line => line.trim());
    let srtContent = '';
    let counter = 1;
    let currentTime = 0;

    lines.forEach((line, index) => {
      const startTime = formatSRTTime(currentTime);
      currentTime += Math.max(3, Math.ceil(line.length / 20)); // Estimate based on text length
      const endTime = formatSRTTime(currentTime);
      
      srtContent += `${counter}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${line}\n\n`;
      counter++;
    });

    const blob = new Blob([srtContent], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'transcription'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const downloadVoiceover = () => {
    if (!voiceoverScript) return;

    const blob = new Blob([voiceoverScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceover-script-${selectedEmotion}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setTranscription('');
    setVoiceoverScript('');
    setStatus('idle');
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'uploading':
        return { text: 'Uploading...', color: 'text-primary' };
      case 'transcribing':
        return { text: 'Transcribing with AI...', color: 'text-primary' };
      case 'translating':
        return { text: 'Translating...', color: 'text-primary' };
      case 'generating-voiceover':
        return { text: 'Generating voice-over script...', color: 'text-primary' };
      case 'complete':
        return { text: 'Complete!', color: 'text-success' };
      case 'error':
        return { text: 'Error occurred', color: 'text-destructive' };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 gradient-hero pointer-events-none" />
      
      <Navbar />

      <main className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-foreground/60">
              Upload your audio or video files to transcribe and generate voice-overs.
            </p>
          </div>

          {/* Upload Zone */}
          <Card variant="glass" className="p-8 mb-6">
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-border hover:border-primary/50'
                  }`}
              >
                <input
                  type="file"
                  accept="audio/*,video/*,.mp3,.mp4,.wav,.m4a,.webm,.mov,.ogg"
                  onChange={handleInputChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-subtle">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Drop your files here
                  </h3>
                  <p className="text-sm text-foreground/60 mb-4">
                    or click to browse
                  </p>
                  <p className="text-sm text-foreground/60 mb-2">
                    Supports MP3, MP4, WAV, M4A, WebM, and more
                  </p>
                  <p className="text-xs text-foreground/40">
                    Maximum file size: 500MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selected File */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <FileAudio className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-foreground/60">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFile}
                    className="text-foreground/60 hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Languages className="w-4 h-4 inline mr-2" />
                    Translate to (optional)
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full p-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Original language only</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Status Bar */}
                {statusDisplay && status !== 'idle' && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                    {status === 'complete' ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : status === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
                    <span className={`font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                )}

                {/* Process Button */}
                {status === 'idle' && (
                  <Button 
                    onClick={processFile} 
                    className="w-full gradient-primary text-white font-medium py-6"
                    size="lg"
                  >
                    Start Transcription
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Results Section */}
          {transcription && (
            <Card variant="glass" className="p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={activeTab === 'transcription' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('transcription')}
                  className={activeTab === 'transcription' ? 'gradient-primary text-white' : 'text-foreground'}
                >
                  Transcription
                </Button>
                <Button
                  variant={activeTab === 'voiceover' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('voiceover')}
                  className={activeTab === 'voiceover' ? 'gradient-primary text-white' : 'text-foreground'}
                >
                  Voice-Over Script
                </Button>
              </div>

              {activeTab === 'transcription' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Transcription Result</h3>
                    <Button 
                      onClick={downloadSRT} 
                      size="sm"
                      className="gradient-primary text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download SRT
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border max-h-96 overflow-y-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {transcription}
                    </pre>
                  </div>

                  {/* Voice-over Generation */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Mic className="w-5 h-5" />
                      Generate Voice-Over Script
                    </h4>
                    
                    {/* Emotion Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-foreground/80 mb-3">
                        Select Emotion
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {emotions.map((emotion) => (
                          <button
                            key={emotion.id}
                            onClick={() => setSelectedEmotion(emotion.id)}
                            className={`p-3 rounded-lg border transition-all text-center
                              ${selectedEmotion === emotion.id 
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                                : 'border-border hover:border-primary/50 bg-muted/30'
                              }`}
                          >
                            <span className="text-2xl block mb-1">{emotion.emoji}</span>
                            <span className="text-xs text-foreground/70">{emotion.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={generateVoiceover}
                      disabled={status === 'generating-voiceover'}
                      className="gradient-primary text-white font-medium"
                    >
                      {status === 'generating-voiceover' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Generate Voice-Over Script
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {activeTab === 'voiceover' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Voice-Over Script ({emotions.find(e => e.id === selectedEmotion)?.label})
                    </h3>
                    {voiceoverScript && (
                      <Button 
                        onClick={downloadVoiceover} 
                        size="sm"
                        className="gradient-primary text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Script
                      </Button>
                    )}
                  </div>
                  {voiceoverScript ? (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border max-h-96 overflow-y-auto">
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                        {voiceoverScript}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-foreground/50">
                      <Mic className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Generate a voice-over script from the Transcription tab</p>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}