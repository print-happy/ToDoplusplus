import React, { useState, useRef } from 'react';
import { InputNumber, Button, Modal, Typography } from 'antd';

const CountdownPage: React.FC = () => {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(1);
  const [seconds, setSeconds] = useState<number>(0);
  const [left, setLeft] = useState<number>(60);
  const [running, setRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  const start = () => {
    const total = totalSeconds;
    setLeft(total);
    setRunning(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setShowModal(true);
          if (audioRef.current) audioRef.current.play();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stop = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    setLeft(totalSeconds);
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
      <Typography.Title level={2}>倒计时</Typography.Title>
      <div style={{ marginBottom: 24 }}>
        <InputNumber
          min={0}
          max={23}
          value={hours}
          onChange={v => setHours(Number(v))}
          disabled={running}
        /> 小时
        <InputNumber
          min={0}
          max={59}
          value={minutes}
          onChange={v => setMinutes(Number(v))}
          disabled={running}
        /> 分钟
        <InputNumber
          min={0}
          max={59}
          value={seconds}
          onChange={v => setSeconds(Number(v))}
          disabled={running}
        /> 秒
      </div>
      <div style={{ fontSize: 48, marginBottom: 24 }}>
        {formatTime(left)}
      </div>
      <Button type="primary" onClick={start} disabled={running || totalSeconds === 0} style={{ marginRight: 8 }}>开始</Button>
      <Button onClick={stop} disabled={!running} style={{ marginRight: 8 }}>暂停</Button>
      <Button onClick={reset}>重置</Button>
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={() => setShowModal(false)}
        title="时间到！"
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>倒计时已结束！</p>
      </Modal>
      <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5c7.mp3" preload="auto" />
    </div>
  );
};

export default CountdownPage; 