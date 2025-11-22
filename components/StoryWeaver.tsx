import React, { useState, useRef, useEffect } from 'react';
import { Upload, Volume2, StopCircle, Wand2, Image as ImageIcon, AlertCircle, BookOpen } from 'lucide-react';
import { generateStoryFromImage, generateSpeech } from '../services/geminiService';
import { decodeBase64, decodeAudioData, playAudioBuffer } from '../services/audioUtils';
import { LoadingState } from '../types';
import { Spinner } from './Spinner';

export const StoryWeaver: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [storyText, setStoryText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Audio Context on mount (or first user interaction technically required by some browsers, but we'll try lazy init)
  useEffect(() => {
    return () => {
      // Cleanup audio on unmount
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setStoryText(null);
      setErrorMsg(null);
      stopAudio();
      setLoadingState(LoadingState.IDLE);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateStory = async () => {
    if (!imagePreview) return;
    
    setLoadingState(LoadingState.ANALYZING);
    setErrorMsg(null);
    setStoryText(null);
    stopAudio();

    try {
      const text = await generateStoryFromImage(imagePreview);
      setStoryText(text);
      setLoadingState(LoadingState.IDLE);
    } catch (err) {
      setErrorMsg("Failed to generate story. Please try again.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleReadAloud = async () => {
    if (!storyText) return;

    // If already playing, stop
    if (loadingState === LoadingState.PLAYING) {
      stopAudio();
      return;
    }

    // If we have the buffer already, just play it
    if (audioBufferRef.current && audioContextRef.current) {
      playBuffer(audioBufferRef.current);
      return;
    }

    setLoadingState(LoadingState.GENERATING_AUDIO);
    
    try {
      const base64Audio = await generateSpeech(storyText);
      if (!base64Audio) throw new Error("No audio data returned");

      // Lazy init audio context
      if (!audioContextRef.current) {
        const AudioCtor = (window.AudioContext || (window as any).webkitAudioContext);
        audioContextRef.current = new AudioCtor({ sampleRate: 24000 });
      }

      const audioBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(
        audioBytes, 
        audioContextRef.current, 
        24000, 
        1
      );
      
      audioBufferRef.current = audioBuffer;
      playBuffer(audioBuffer);

    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate audio.");
      setLoadingState(LoadingState.IDLE); // Go back to idle (text shown)
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    stopAudio(); // Ensure no overlapping sounds

    const source = playAudioBuffer(
      audioContextRef.current,
      buffer,
      () => setLoadingState(LoadingState.IDLE)
    );
    
    audioSourceRef.current = source;
    setLoadingState(LoadingState.PLAYING);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      audioSourceRef.current = null;
    }
    setLoadingState((prev) => (prev === LoadingState.PLAYING ? LoadingState.IDLE : prev));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Column: Input */}
      <div className="flex flex-col space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          {imagePreview ? (
            <div className="relative w-full h-full flex flex-col items-center">
              <img 
                src={imagePreview} 
                alt="Uploaded" 
                className="max-h-[500px] w-auto object-contain rounded-lg shadow-md"
              />
              <button 
                onClick={() => {
                   setImagePreview(null);
                   setStoryText(null);
                   fileInputRef.current!.value = '';
                }}
                className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-slate-600 hover:text-red-500 transition-colors shadow-sm"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all group py-20"
            >
              <div className="bg-indigo-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-lg font-medium text-slate-700">Upload a scene</p>
              <p className="text-sm text-slate-400 mt-2">JPG, PNG up to 5MB</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <button
          onClick={handleGenerateStory}
          disabled={!imagePreview || loadingState !== LoadingState.IDLE}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center shadow-lg transition-all transform active:scale-[0.98] ${
            !imagePreview || loadingState !== LoadingState.IDLE
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-500/30'
          }`}
        >
          {loadingState === LoadingState.ANALYZING ? (
            <>
              <Spinner className="w-6 h-6 mr-3 text-white" />
              Weaving Story...
            </>
          ) : (
            <>
              <Wand2 className="w-6 h-6 mr-2" />
              Generate Story
            </>
          )}
        </button>
      </div>

      {/* Right Column: Output */}
      <div className="flex flex-col h-full min-h-[500px]">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 flex-grow relative overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
            <h3 className="font-serif font-bold text-slate-700 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
              The Story
            </h3>
            {storyText && (
               <div className="flex space-x-2">
                 {loadingState === LoadingState.GENERATING_AUDIO && (
                   <span className="text-xs font-medium text-indigo-600 flex items-center bg-indigo-50 px-2 py-1 rounded-full animate-pulse">
                     Generating Voice...
                   </span>
                 )}
               </div>
            )}
          </div>

          <div className="p-8 flex-grow overflow-y-auto relative">
             {errorMsg && (
               <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center text-sm">
                 <AlertCircle className="w-4 h-4 mr-2" />
                 {errorMsg}
               </div>
             )}
             
             {!storyText && !errorMsg && (
               <div className="h-full flex flex-col items-center justify-center text-slate-300">
                 <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                 <p className="font-serif italic">Your story will appear here...</p>
               </div>
             )}

             {storyText && (
               <div className="prose prose-slate prose-lg max-w-none">
                 <p className="font-serif leading-loose text-slate-800 animate-fade-in">
                   {storyText}
                 </p>
               </div>
             )}
          </div>

          {/* Action Bar for Audio */}
          {storyText && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 backdrop-blur-sm">
              <button
                onClick={handleReadAloud}
                disabled={loadingState === LoadingState.GENERATING_AUDIO}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all ${
                  loadingState === LoadingState.PLAYING
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {loadingState === LoadingState.PLAYING ? (
                  <>
                    <StopCircle className="w-5 h-5 mr-2" />
                    Stop Narration
                  </>
                ) : loadingState === LoadingState.GENERATING_AUDIO ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2 text-indigo-600" />
                    Synthesizing Voice...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" />
                    Read Aloud
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};