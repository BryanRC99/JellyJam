export interface JellyfinUser {
  Id: string;
  Name: string;
  ServerId: string;
  PrimaryImageTag?: string;
}

export interface JellyfinAuthResult {
  User: JellyfinUser;
  AccessToken: string;
  ServerId: string;
}