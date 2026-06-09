interface Props {
  muted: boolean;
  onToggle: () => void;
}

/** 静音开关按钮（仅音频就绪时由父组件渲染）。 */
export default function MuteButton({ muted, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? '取消静音' : '静音'}
      style={{
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 5,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(0,0,0,0.5)',
        color: '#fff',
        fontSize: 20,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
