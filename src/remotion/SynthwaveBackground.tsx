import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Constants
const DURATION_FRAMES = 6690; // 3:43 at 30fps
const SUNSET_FRAME = 4200; // 2:20 mark - sun reaches horizon
const SUN_STRIPES = 8;
const STAR_COUNT = 120;
const CLOUD_COUNT = 8;

// Color palette
const COLORS = {
  sunStripe: "#1A1A2E",
};

// Better pseudo-random hash function for proper distribution
const hash = (n: number): number => {
  let x = Math.sin(n * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Generate properly distributed stars
const generateStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const h1 = hash(i * 1.1);
    const h2 = hash(i * 2.3 + 100);
    const h3 = hash(i * 3.7 + 200);
    const h4 = hash(i * 4.9 + 300);
    const h5 = hash(i * 5.3 + 400);

    stars.push({
      x: h1 * 100, // Full width distribution
      y: h2 * 45, // Upper 45% of screen (above gas station)
      size: 1 + h3 * 2.5,
      twinkleOffset: h4 * 200,
      twinkleSpeed: 0.015 + h5 * 0.025,
      brightness: 0.6 + h3 * 0.4, // Varying brightness
    });
  }
  return stars;
};

// Generate wispy cloud layers
const generateClouds = (count: number) => {
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const h1 = hash(i * 7.1 + 50);
    const h2 = hash(i * 8.3 + 150);
    const h3 = hash(i * 9.7 + 250);
    const h4 = hash(i * 10.9 + 350);
    const h5 = hash(i * 11.3 + 450);

    clouds.push({
      initialX: -600 + h1 * 2400, // Spread across and beyond screen
      y: 8 + h2 * 35, // Upper sky area
      width: 400 + h3 * 800, // Wide, stretched clouds
      height: 15 + h4 * 40, // Thin, wispy
      speed: 3.0 + h5 * 4.5, // 3x faster drift
      opacity: 0.15 + h3 * 0.25,
      blur: 8 + h4 * 15,
      skew: -15 + h5 * 30, // Slight angle variation
    });
  }
  return clouds;
};

const STARS = generateStars(STAR_COUNT);
const CLOUDS = generateClouds(CLOUD_COUNT);

// Sky gradient component
const SkyGradient: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = interpolate(frame, [0, SUNSET_FRAME, DURATION_FRAMES], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Interpolate RGB values for smooth transition
  const topR = Math.round(interpolate(progress, [0, 1], [26, 13]));
  const topG = Math.round(interpolate(progress, [0, 1], [26, 13]));
  const topB = Math.round(interpolate(progress, [0, 1], [46, 26]));

  const midR = Math.round(interpolate(progress, [0, 1], [74, 26]));
  const midG = Math.round(interpolate(progress, [0, 1], [26, 26]));
  const midB = Math.round(interpolate(progress, [0, 1], [94, 62]));

  const horizonR = Math.round(interpolate(progress, [0, 1], [255, 45]));
  const horizonG = Math.round(interpolate(progress, [0, 1], [107, 27]));
  const horizonB = Math.round(interpolate(progress, [0, 1], [53, 78]));

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(
          to bottom,
          rgb(${topR}, ${topG}, ${topB}) 0%,
          rgb(${midR}, ${midG}, ${midB}) 40%,
          rgb(${horizonR}, ${horizonG}, ${horizonB}) 70%
        )`,
      }}
    />
  );
};

// Synthwave sun with horizontal stripes - softer colors, big glow
const SynthwaveSun: React.FC<{ frame: number }> = ({ frame }) => {
  const sunRadius = 160; // Slightly smaller
  const startY = 1080 * 0.22; // Start lower (22% down the screen)
  const endY = 1080 * 0.65;

  const sunY = interpolate(frame, [0, SUNSET_FRAME], [startY, endY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const colorProgress = interpolate(frame, [0, SUNSET_FRAME], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Softer, more muted/pastel colors that blend with the sky
  const centerR = Math.round(interpolate(colorProgress, [0, 0.5, 1], [255, 255, 230]));
  const centerG = Math.round(interpolate(colorProgress, [0, 0.5, 1], [200, 160, 100]));
  const centerB = Math.round(interpolate(colorProgress, [0, 0.5, 1], [140, 120, 130]));

  const edgeR = Math.round(interpolate(colorProgress, [0, 0.5, 1], [255, 240, 200]));
  const edgeG = Math.round(interpolate(colorProgress, [0, 0.5, 1], [140, 100, 80]));
  const edgeB = Math.round(interpolate(colorProgress, [0, 0.5, 1], [140, 140, 140]));

  const stripes = useMemo(() => {
    const result = [];
    for (let i = 0; i < SUN_STRIPES; i++) {
      const normalizedPos = (i + 1) / (SUN_STRIPES + 1);
      const stripeY = sunRadius * 2 * (normalizedPos * normalizedPos);
      const stripeHeight = 8 - i * 0.5;
      result.push({ y: stripeY, height: Math.max(stripeHeight, 3) });
    }
    return result;
  }, []);

  // Full opacity until after sunset, then fade
  const sunOpacity = interpolate(frame, [SUNSET_FRAME, SUNSET_FRAME + 600], [1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow opacity separate - always visible and soft
  const glowOpacity = interpolate(frame, [SUNSET_FRAME, SUNSET_FRAME + 600], [0.5, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {/* Outer glow layer - behind the sun */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: sunY + sunRadius,
          transform: "translateX(-50%) translateY(-50%)",
          width: sunRadius * 4,
          height: sunRadius * 4,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${centerR}, ${centerG}, ${centerB}, ${glowOpacity * 0.4}) 0%, rgba(${edgeR}, ${edgeG}, ${edgeB}, ${glowOpacity * 0.2}) 40%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />
      {/* Main sun - opaque with cutout stripes */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: sunY,
          transform: "translateX(-50%)",
          width: sunRadius * 2,
          height: sunRadius * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgb(${centerR}, ${centerG}, ${centerB}) 0%, rgb(${edgeR}, ${edgeG}, ${edgeB}) 100%)`,
          opacity: sunOpacity,
          overflow: "hidden",
        }}
      >
        {/* Stripes cut through to show sky behind */}
        {stripes.map((stripe, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: stripe.y,
              height: stripe.height,
              backgroundColor: COLORS.sunStripe,
            }}
          />
        ))}
      </div>
    </>
  );
};

// Wispy cloud component - stretched across sky
const WispyCloud: React.FC<{
  frame: number;
  initialX: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
  blur: number;
  skew: number;
}> = ({ frame, initialX, y, width, height, speed, opacity, blur, skew }) => {
  const x = initialX + frame * speed;
  // Wrap with larger bounds for wide clouds
  const totalWidth = 1920 + width * 2;
  const wrappedX = ((x + width) % totalWidth) - width;

  // Color transition from warm sunset to cool night
  const colorProgress = interpolate(frame, [0, SUNSET_FRAME, DURATION_FRAMES], [0, 0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Sunset: warm pinks/oranges, Night: cool purples/blues
  const cloudR = Math.round(interpolate(colorProgress, [0, 0.5, 1], [255, 180, 80]));
  const cloudG = Math.round(interpolate(colorProgress, [0, 0.5, 1], [180, 120, 60]));
  const cloudB = Math.round(interpolate(colorProgress, [0, 0.5, 1], [200, 180, 120]));

  return (
    <div
      style={{
        position: "absolute",
        left: wrappedX,
        top: `${y}%`,
        width: width,
        height: height,
        opacity: opacity,
        filter: `blur(${blur}px)`,
        transform: `skewX(${skew}deg)`,
        background: `linear-gradient(90deg,
          transparent 0%,
          rgba(${cloudR}, ${cloudG}, ${cloudB}, 0.4) 20%,
          rgba(${cloudR}, ${cloudG}, ${cloudB}, 0.6) 50%,
          rgba(${cloudR}, ${cloudG}, ${cloudB}, 0.4) 80%,
          transparent 100%
        )`,
        borderRadius: "50%",
      }}
    />
  );
};

// Star field component with proper distribution
const StarField: React.FC<{ frame: number }> = ({ frame }) => {
  // Stars visible during day (faded) and brighten after sunset
  const starsFadeIn = interpolate(
    frame,
    [0, SUNSET_FRAME, SUNSET_FRAME + 600],
    [0.15, 0.2, 1], // Faint during day, full brightness after sunset
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: starsFadeIn }}>
      {STARS.map((star, i) => {
        const twinkle =
          0.3 + 0.7 * Math.sin((frame + star.twinkleOffset) * star.twinkleSpeed);
        const finalOpacity = twinkle * star.brightness;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              opacity: finalOpacity,
              boxShadow: `0 0 ${star.size * 3}px ${star.size}px rgba(255, 255, 255, ${finalOpacity * 0.6})`,
            }}
          />
        );
      })}
    </div>
  );
};

// Intensified multi-layer color filter
const ColorFilter: React.FC<{ frame: number }> = ({ frame }) => {
  const filterProgress = interpolate(
    frame,
    [0, SUNSET_FRAME, DURATION_FRAMES],
    [0, 0.5, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Primary color overlay - more intense
  const primaryR = Math.round(interpolate(filterProgress, [0, 0.5, 1], [255, 220, 60]));
  const primaryG = Math.round(interpolate(filterProgress, [0, 0.5, 1], [120, 80, 80]));
  const primaryB = Math.round(interpolate(filterProgress, [0, 0.5, 1], [80, 140, 180]));
  const primaryOpacity = interpolate(filterProgress, [0, 0.5, 1], [0.25, 0.2, 0.3]);

  // Secondary vignette/gradient overlay for cohesion
  const vignetteOpacity = interpolate(filterProgress, [0, 0.5, 1], [0.15, 0.2, 0.25]);

  return (
    <>
      {/* Primary color overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(${primaryR}, ${primaryG}, ${primaryB}, ${primaryOpacity})`,
          mixBlendMode: "overlay",
        }}
      />
      {/* Warm/cool tint layer */}
      <AbsoluteFill
        style={{
          background: interpolate(filterProgress, [0, 1], [0, 1]) < 0.5
            ? `radial-gradient(ellipse at 50% 70%, rgba(255, 150, 100, 0.2) 0%, transparent 70%)`
            : `radial-gradient(ellipse at 50% 30%, rgba(100, 120, 200, 0.15) 0%, transparent 70%)`,
          mixBlendMode: "soft-light",
        }}
      />
      {/* Vignette for unified look */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(10, 5, 20, ${vignetteOpacity}) 100%)`,
        }}
      />
      {/* Saturation boost via color multiply */}
      <AbsoluteFill
        style={{
          backgroundColor: interpolate(filterProgress, [0, 1], [0, 1]) < 0.5
            ? "rgba(255, 200, 180, 0.08)"
            : "rgba(180, 180, 255, 0.08)",
          mixBlendMode: "color",
        }}
      />
    </>
  );
};

// Main composition
export const SynthwaveBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Layer 1: Sky gradient */}
      <SkyGradient frame={frame} />

      {/* Layer 2: Synthwave sun */}
      <SynthwaveSun frame={frame} />

      {/* Layer 3: Wispy cloud layer */}
      {CLOUDS.map((cloud, i) => (
        <WispyCloud
          key={i}
          frame={frame}
          initialX={cloud.initialX}
          y={cloud.y}
          width={cloud.width}
          height={cloud.height}
          speed={cloud.speed}
          opacity={cloud.opacity}
          blur={cloud.blur}
          skew={cloud.skew}
        />
      ))}

      {/* Layer 4: Star field */}
      <StarField frame={frame} />

      {/* Layer 5: Gas station foreground */}
      <AbsoluteFill>
        <Img
          src={staticFile("gas-station.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Layer 6: Intensified color filter overlay */}
      <ColorFilter frame={frame} />
    </AbsoluteFill>
  );
};
