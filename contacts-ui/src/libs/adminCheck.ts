// Group name comes from an env var so dev and prod can differ. 
// Set ADMIN_GROUP in the OpenShift config, e.g. APP-Contacts-Admins 
const ADMIN_GROUP = (process.env.ADMIN_GROUP ?? '').toLowerCase(); 
const ADMIN_ROLE = 'admin';   // still honoured, so your dev/GitHub hard-coded role keeps working 
 

/** Keycloak sends groups as "/Name" or a full path "/AD/Dept/Name"; compare the last part only. */ 
function inAdminGroup(groups: string[] = []): boolean { 
  if (!ADMIN_GROUP) return false; 
  return groups.some((g) => (g.split('/').pop() ?? '').toLowerCase() === ADMIN_GROUP); 
} 
 

export function isAdminUser(user?: { roles?: string[]; groups?: string[] } | null): boolean { 
  if (!user) return false; 
  return inAdminGroup(user.groups) || (user.roles ?? []).includes(ADMIN_ROLE); 
} 
 