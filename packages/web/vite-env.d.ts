/// <reference types="vite/client" />

declare var google: any;

declare global {
    interface Window {
        google: any;
        gtag: (...args: any[]) => void;
    }
}
