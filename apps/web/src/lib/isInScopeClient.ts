export function isInScopeClient(doc: any, scopes: any) {
  if (!scopes) return false;
  const sId = doc.settlementId;
  const mun = doc.settlementMunicipality || doc.municipality;
  const prov = doc.settlementProvince || doc.province;
  if (Array.isArray(scopes.settlements) && scopes.settlements.includes(sId)) return true;
  if (Array.isArray(scopes.municipalities) && mun && scopes.municipalities.includes(mun)) return true;
  if (Array.isArray(scopes.provinces) && prov && scopes.provinces.includes(prov)) return true;
  return false;
}
