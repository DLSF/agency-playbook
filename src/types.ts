export interface PlaybookPage {
  name: string;
  url: string;
  icon?: string;
  description?: string;
  tag?: string;
}

export interface UserProfile {
  full: string;
  title: string;
  email?: string;
  phone?: string;
}

export interface UserDirectory {
  [key: string]: UserProfile;
}
