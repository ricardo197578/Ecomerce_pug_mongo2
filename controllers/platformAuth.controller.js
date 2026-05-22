const PLATFORM_USER = "admin";
const PLATFORM_PASSWORD = "codenova123";

export const platformAuthController = {
  showLogin(_req, res) {
    res.render("platform/login", {
      title: "Login plataforma",
      errorMessage: null
    });
  },
  login(req, res) {
    const user = String(req.body.user || "").trim();
    const password = String(req.body.password || "").trim();
    if (user === PLATFORM_USER && password === PLATFORM_PASSWORD) {
      req.session.isPlatformAdmin = true;
      return res.redirect("/");
    }
    return res.status(401).render("platform/login", {
      title: "Login plataforma",
      errorMessage: "Credenciales invalidas."
    });
  },
  logout(req, res, next) {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.redirect("/");
    });
  }
};
