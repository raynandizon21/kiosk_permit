import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The APK doesn't bundle the app — it's a native WebView shell pointed at the PC
 * running `npm run dev` / `npm start` on the same Wi-Fi (same model as opening the
 * kiosk URL in a tablet browser, see README "Using a tablet as the kiosk").
 *
 * Change `server.url` below to that PC's LAN IP before building, e.g.
 * 'http://192.168.1.10:3200/kiosk'. Find the IP from the server's own startup output,
 * or `npm run firewall:allow`. `cleartext: true` is required since the LAN server is
 * plain HTTP; `allowNavigation` keeps the in-app "Connect to another server" switch
 * (tap the System Online badge) working for any other address on the same network.
 */
const config: CapacitorConfig = {
  appId: 'ph.edu.snc.permitkiosk',
  appName: 'SNC Permit Kiosk',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.10:3200/kiosk',
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
