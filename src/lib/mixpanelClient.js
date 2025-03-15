import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token is missing! Check your .env file.');
    return;
  }

  mixpanel.init(MIXPANEL_TOKEN, { autocapture: false });
};

// Track page views
export const trackPageView = (url) => {
  mixpanel.track('Page View', { url });
};

// Track events
export const trackEvent = (name, props) => {
  mixpanel.track(name, props);
};

// Identify users
export const identifyUser = (userId, userProps) => {
  mixpanel.identify(userId);
  if (userProps) {
    mixpanel.people.set(userProps);
  }
}; 