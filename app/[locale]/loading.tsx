export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '3px',
      backgroundColor: 'transparent',
      zIndex: 99999,
      pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: '30%',
        backgroundColor: '#003077',
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

