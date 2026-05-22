export function requirePlatformAuth(req, res, next) {
  if (req.session?.isPlatformAdmin) {
    return next();
  }
  return res.redirect("/platform/login");
}
