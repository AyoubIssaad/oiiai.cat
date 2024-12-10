export async function generateShareCard({ score, speed, type = 'score' }) {
  // Create a canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size (1200x630 is ideal for social media)
  canvas.width = 1200;
  canvas.height = 630;

  // Load assets
  const fontReady = await document.fonts.load('700 48px Orbitron');
  const catImage = await loadImage('/cat.png');

  // Draw background
  ctx.fillStyle = '#F0F9FF'; // Light blue background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add decorative elements
  drawStars(ctx);

  // Draw cat image
  const imageSize = 200;
  ctx.drawImage(
    catImage,
    (canvas.width - imageSize) / 2,
    100,
    imageSize,
    imageSize
  );

  // Set text styles
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1D4ED8';
  ctx.font = '700 48px Orbitron';

  // Draw title
  ctx.fillText('Oiiai Cat', canvas.width / 2, 380);

  // Draw achievement
  if (type === 'score') {
    ctx.fillText(`New High Score: ${Math.round(score).toLocaleString()}!`, canvas.width / 2, 450);
  } else {
    ctx.fillText(`Spinning at ${speed}x Speed!`, canvas.width / 2, 450);
  }

  // Add footer
  ctx.font = '400 24px Orbitron';
  ctx.fillStyle = '#3B82F6';
  ctx.fillText('Join the spinning cat revolution at oiiai.cat', canvas.width / 2, 550);

  // Convert canvas to blob
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
}

// Helper function to load images
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Helper function to draw decorative stars
function drawStars(ctx) {
  const stars = 20;
  ctx.fillStyle = '#FCD34D';

  for (let i = 0; i < stars; i++) {
    const x = Math.random() * ctx.canvas.width;
    const y = Math.random() * ctx.canvas.height;
    const size = Math.random() * 4 + 2;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Share function that generates and shares the card
export async function shareAchievement({ score, speed, type = 'score' }) {
  try {
    const blob = await generateShareCard({ score, speed, type });
    const file = new File([blob], 'oiiai-achievement.png', { type: 'image/png' });

    // Prepare share data
    const shareData = {
      title: 'Oiiai Cat Achievement!',
      text: type === 'score'
        ? `I just scored ${Math.round(score).toLocaleString()} points in Oiiai Cat!`
        : `Check out my ${speed}x speed spin in Oiiai Cat!`,
      url: 'https://oiiai.cat',
      files: [file]
    };

    // Try native sharing first
    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }

    // Fallback to clipboard
    const shareUrl = URL.createObjectURL(blob);
    await navigator.clipboard.writeText(shareData.text + '\n' + shareData.url);
    alert('Share image copied! You can now paste it in your favorite social media.');
    URL.revokeObjectURL(shareUrl);
    return true;

  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
}
