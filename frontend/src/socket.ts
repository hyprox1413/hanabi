import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
export const HTTP_URL = "http://localhost:3000";
export const SOCK_URL = "http://localhost:4000";

export const socket = io(SOCK_URL);