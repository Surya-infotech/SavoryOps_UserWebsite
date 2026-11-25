import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";

/**
 * Universal loading fallback component for Suspense route-level transitions
 * matching SavoryOps_AdminPanel / SavoryOps_OwnerWeb LoadingSpinner pattern.
 */
const LoadingSpinner = ({ type = "page", size = 36 }) => {
  if (type === "spinner") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "3rem 1.5rem",
          width: "100%",
          minHeight: "220px",
        }}
      >
        <CircularProgress
          size={size}
          sx={{ color: "var(--primary-color, #028802)" }}
        />
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div
        style={{
          width: "100%",
          padding: "24px",
          borderRadius: "16px",
          border: "1px solid var(--border-color, #e2e8f0)",
          backgroundColor: "#ffffff",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <Skeleton animation="wave" variant="text" width={200} height={32} />
          <Skeleton
            animation="wave"
            variant="rounded"
            width={120}
            height={36}
            sx={{ borderRadius: "9999px" }}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton
              key={idx}
              animation="wave"
              variant="rounded"
              height={88}
              sx={{ borderRadius: "12px" }}
            />
          ))}
        </div>
        <Skeleton
          animation="wave"
          variant="rounded"
          height={180}
          sx={{ borderRadius: "12px" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1320px",
        width: "100%",
        margin: "0 auto",
        padding: "1.5rem",
        boxSizing: "border-box",
      }}
    >
      <Skeleton
        animation="wave"
        variant="rounded"
        width={220}
        height={32}
        sx={{ borderRadius: "9999px", mb: 2.5 }}
      />
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid var(--border-color, #e2e8f0)",
          padding: "1.5rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Skeleton
          animation="wave"
          variant="text"
          width="38%"
          height={34}
          sx={{ mb: 2 }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton
              key={idx}
              animation="wave"
              variant="rounded"
              height={140}
              sx={{ borderRadius: "14px" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
