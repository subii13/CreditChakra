import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="navbar__brand">
          CreditChakra
        </Link>
        <div className="navbar__links">
          <Link to="/schemes">Schemes</Link>
          {user ? (
            <>
              <Link to="/my-path">My Path</Link>
              <button
                onClick={async () => {
                  await signOut();
                  navigate("/");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </nav>
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <Outlet />
      </main>
    </div>
  );
}
