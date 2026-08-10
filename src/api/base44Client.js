import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { simplyClient } from '@/api/simplyClient';

const { appId, token, functionsVersion, appBaseUrl } = appParams;
const useSimplyApi = import.meta.env.VITE_API_MODE === 'simply';

//Create a client with authentication required
export const base44 = useSimplyApi ? simplyClient : createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});
