import React, { useEffect, useRef } from 'react';

const StarryNightBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redimensionner le canvas pour remplir la fenêtre
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Générer des étoiles aléatoirement
    const stars: { x: number; y: number; size: number; brightness: number; speed: number; angle: number; distance: number; originalX: number; originalY: number }[] = [];
    const generateStars = () => {
      stars.length = 0; // Vider le tableau existant
      const starCount = Math.floor((window.innerWidth * window.innerHeight) / 2500); // Moins d'étoiles pour un affichage plus aéré
      
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        stars.push({
          x,
          y,
          originalX: x,
          originalY: y,
          size: Math.random() * 1.5,
          brightness: Math.random(),
          speed: Math.random() * 0.05,
          angle: Math.random() * Math.PI * 2, // Angle de déplacement
          distance: Math.random() * 50 // Distance de mouvement
        });
      }
    };

    generateStars();

    // Animation des étoiles scintillantes et mobiles
    let animationFrameId: number;
    const time = Date.now();
    const animate = () => {
      if (!ctx) return;
      
      // Calculer le temps écoulé pour l'animation
      const elapsed = Date.now() - time;
      
      // Dessiner le fond noir profond
      ctx.fillStyle = '#000011'; // Bleu nuit profond
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dessiner la galaxie centrale subtile
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const gradient = ctx.createRadialGradient(
        centerX, 
        centerY, 
        0, 
        centerX, 
        centerY, 
        Math.max(canvas.width, canvas.height) * 0.8
      );
      gradient.addColorStop(0, 'rgba(100, 80, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(70, 50, 150, 0.05)');
      gradient.addColorStop(1, 'rgba(30, 10, 80, 0.02)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dessiner les étoiles
      stars.forEach(star => {
        // Mettre à jour la position pour l'effet de mouvement
        const movementFactor = Math.sin(elapsed * 0.001 + star.angle) * 0.5;
        star.x = star.originalX + Math.cos(star.angle) * star.distance * movementFactor;
        star.y = star.originalY + Math.sin(star.angle) * star.distance * movementFactor;
        
        // Mettre à jour la brillance pour l'effet de scintillement
        star.brightness += (Math.random() - 0.5) * star.speed;
        if (star.brightness > 1) star.brightness = 1;
        if (star.brightness < 0.3) star.brightness = 0.3;

        // Dessiner l'étoile
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();


      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Nettoyage
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ background: '#000011' }}
    />
  );
};

export default StarryNightBackground;