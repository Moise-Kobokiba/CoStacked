// Consolidated adapter: re-export the canonical SocketProvider and hooks
// from the single implementation at `SocketProvider.jsx` so the app
// only creates one global socket instance and consumers can import
// from either context file without duplication.
import { SocketProvider as CanonicalProvider, useSocket as useSocketCanonical } from './SocketProvider';

export const SocketProvider = CanonicalProvider;
export const useSocketContext = useSocketCanonical;

export default SocketProvider;
