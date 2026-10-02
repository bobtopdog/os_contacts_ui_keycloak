export interface DirectoryUser {
  username: string;
  firstname: string;
  lastname: string;
  telephoneNumber: string;
  email: string;
  found: boolean;          // false if the corporate directory had no record
}
