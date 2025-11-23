import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="page-container" style={{ paddingTop: "4rem", textAlign: "center" }}>
      <Card>
        <h2>Page not found</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          The requested route does not exist. Please return to the dashboard or landing page.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Button onClick={() => navigate("/")}>Back home</Button>
          <Button variant="secondary" onClick={() => navigate("/app")}>
            Open dashboard
          </Button>
        </div>
      </Card>
    </section>
  );
}
