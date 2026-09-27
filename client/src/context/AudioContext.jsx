// client/src/context/AudioContext.jsx
import { useState, useRef, useEffect } from 'react';
import { AudioContext } from './audio-state';

export const AudioProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        if (currentSong) {
            audioRef.current.src = currentSong.file_path;
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    }, [currentSong]);

    useEffect(() => {
        const audio = audioRef.current;
        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        const markPlaying = () => setIsPlaying(true);
        const markPaused = () => setIsPlaying(false);
        const handleEnded = () => { setIsPlaying(false); setCurrentTime(0); };
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('play', markPlaying);
        audio.addEventListener('pause', markPaused);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('play', markPlaying);
            audio.removeEventListener('pause', markPaused);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const seekTo = (time) => {
        const nextTime = Number(time);
        if (!Number.isFinite(nextTime)) return;
        audioRef.current.currentTime = nextTime;
        setCurrentTime(nextTime);
    };

    const setAudioVolume = (value) => {
        const nextVolume = Math.min(1, Math.max(0, Number(value)));
        audioRef.current.volume = nextVolume;
        setVolume(nextVolume);
    };

    return (
        <AudioContext.Provider value={{ currentSong, setCurrentSong, isPlaying, togglePlay, currentTime, duration, seekTo, volume, setAudioVolume }}>
            {children}
        </AudioContext.Provider>
    );
};
