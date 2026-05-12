import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TextReveal } from '../components/TextReveal';
import { QRCodeComponent } from '../components/QRCode';
import { fadeIn } from '../utils/transitions';
import { Phone, Smartphone } from 'lucide-react';

export const Scene4CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const backgroundOpacity = fadeIn(frame, fps, 0, 20);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0c4a6e' }}>
      {/* Blurred Background Image */}
      <div
        style={{
          opacity: backgroundOpacity * 0.3,
          filter: 'blur(15px)',
          width: '100%',
          height: '100%',
        }}
      >
        <Img
          src={staticFile('woman-psychologist-child-on-couch.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, rgba(12,74,110,0.95) 0%, rgba(3,105,161,0.95) 100%)',
        }}
      />

      {/* Main Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 80,
        }}
      >
        {/* Headline */}
        <TextReveal
          text="Start Your Journey Today"
          delay={10}
          fontSize={85}
          fontWeight="bold"
          color="#ffffff"
          animationType="scale"
          style={{
            marginBottom: 60,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        />

        {/* QR Code and Contact Info Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 80,
            marginTop: 20,
          }}
        >
          {/* QR Code */}
          <div style={{ opacity: frame > 20 ? 1 : 0 }}>
            <QRCodeComponent url="https://example.com" size={280} delay={20} />
          </div>

          {/* Divider */}
          <div
            style={{
              width: 3,
              height: 300,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
            }}
          />

          {/* Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Scan the Code */}
            <TextReveal
              text="Scan the Code"
              delay={35}
              fontSize={48}
              fontWeight="600"
              color="#a5f3fc"
              animationType="slide"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <Smartphone size={50} color="#a5f3fc" style={{ marginRight: 15 }} />
            </TextReveal>

            {/* OR divider */}
            <div
              style={{
                fontSize: 40,
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              OR
            </div>

            {/* Text this Number */}
            <div style={{ opacity: frame > 55 ? 1 : 0 }}>
              <TextReveal
                text="Text This Number"
                delay={55}
                fontSize={42}
                fontWeight="600"
                color="#a5f3fc"
                animationType="slide"
                style={{
                  marginBottom: 15,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: '20px 40px',
                  borderRadius: 15,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                <Phone size={45} color="#fbbf24" />
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: 'bold',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    letterSpacing: '3px',
                  }}
                >
                  (555) 123-4567
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <TextReveal
          text="Your next chapter starts here."
          delay={75}
          fontSize={44}
          fontWeight="500"
          color="#e0f2fe"
          animationType="fade"
          style={{
            marginTop: 60,
            fontStyle: 'italic',
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
