import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // All your aliases now go inside this one object
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      
      // This is the new logo alias you added in the previous step
      'raktsetu-logo.jpg': path.resolve(__dirname, './src/assets/raktsetu-logo.jpg'),
      'MHFW.png': path.resolve(__dirname, './src/assets/MHFW.png'),
      'raktkosh.png': path.resolve(__dirname, './src/assets/raktkosh.png'),
      'NHA.png': path.resolve(__dirname, './src/assets/NHA.png'),
      'digital india.webp': path.resolve(__dirname, './src/assets/digital india.webp'),
      'one.png': path.resolve(__dirname, './src/assets/one.png'), // <-- The comma was here
      'two.png': path.resolve(__dirname, './src/assets/two.png'),
      'three.png': path.resolve(__dirname, './src/assets/three.png'),
      'four.png': path.resolve(__dirname, './src/assets/four.png'),
      // This is the standard alias for your src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
    // ── Security headers (mirrors vercel.json for local ZAP scans) ──
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
      // NOTE: HSTS has no effect on http://localhost but is included
      // so that dev-server responses match production exactly.
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'Content-Security-Policy': [
        "default-src 'self'",
        // Scripts: own bundle + Firebase reCAPTCHA + Google APIs
        "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.google.com https://apis.google.com",
        // Styles: own CSS + Google Fonts (link tags in index.html)
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        // Fonts
        "font-src 'self' https://fonts.gstatic.com",
        // Images: own assets + Firebase Storage + Google profile pictures
        "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
        // XHR / fetch / WebSockets: Firebase Auth, Firestore, Storage
        "connect-src 'self' https://*.googleapis.com https://*.firebasedatabase.app https://*.firebaseio.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.firebaseio.com",
        // Frames: reCAPTCHA widget + Firebase Auth popup
        "frame-src https://www.google.com https://*.firebaseapp.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join('; '),
    },
  },
});