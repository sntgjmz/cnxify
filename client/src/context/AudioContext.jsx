// client/src/context/AudioContext.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioContext } from './audio-state';

export const AudioProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [queue, setQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [repeatMode, setRepeatMode] = useState('off');
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
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('play', markPlaying);
        audio.addEventListener('pause', markPaused);
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('play', markPlaying);
            audio.removeEventListener('pause', markPaused);
        };
    }, []);

    const moveToNext = useCallback((respectRepeatOne = false) => {
        if (respectRepeatOne && repeatMode === 'one') {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
            audioRef.current.play().catch(() => setIsPlaying(false));
            return;
        }
        if (queue.length) {
        const [nextSong, ...remainingSongs] = queue;
        setQueue(remainingSongs);
        if (currentSong) setHistory((songs) => [...songs, currentSong]);
        setCurrentSong(nextSong);
            return;
        }
        if (repeatMode === 'all' && currentSong) {
            const cycle = [...history, currentSong];
            const [nextSong, ...remainingSongs] = cycle;
            setHistory([]);
            setQueue(remainingSongs);
            setCurrentSong(nextSong);
            return;
        }
        setIsPlaying(false);
        setCurrentTime(0);
    }, [currentSong, history, queue, repeatMode]);

    const playNext = useCallback(() => moveToNext(false), [moveToNext]);

    const playPrevious = () => {
        if (audioRef.current.currentTime > 3 || !history.length) { seekTo(0); return; }
        const previousSong = history[history.length - 1];
        setHistory((songs) => songs.slice(0, -1));
        if (currentSong) setQueue((songs) => [currentSong, ...songs]);
        setCurrentSong(previousSong);
    };

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => moveToNext(true);
        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [moveToNext]);

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

    const stopPlayback = () => {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        setCurrentSong(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setQueue([]);
        setHistory([]);
    };

    const addToQueue = (song) => setQueue((songs) => [...songs, song]);
    const startPlayback = (song, upcomingSongs = []) => {
        setHistory([]);
        setQueue(upcomingSongs);
        setCurrentSong(song);
    };
    const removeFromQueue = (index) => setQueue((songs) => songs.filter((_, songIndex) => songIndex !== index));
    const clearQueue = () => setQueue([]);
    const cycleRepeatMode = () => setRepeatMode((mode) => mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off');
    const playQueueSong = (index) => {
        const selectedSong = queue[index];
        if (!selectedSong) return;
        setQueue((songs) => songs.filter((_, songIndex) => songIndex !== index));
        if (currentSong) setHistory((songs) => [...songs, currentSong]);
        setCurrentSong(selectedSong);
    };

    return (
        <AudioContext.Provider value={{ currentSong, setCurrentSong, isPlaying, togglePlay, currentTime, duration, seekTo, volume, setAudioVolume, stopPlayback, queue, history, addToQueue, startPlayback, removeFromQueue, clearQueue, playQueueSong, playNext, playPrevious, repeatMode, cycleRepeatMode }}>
            {children}
        </AudioContext.Provider>
    );
};
