import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";

/**
 * Universal loading fallback component for Suspense route-level transitions
 * supporting 'home', 'page', 'detail', and 'spinner' variants.
 */
const LoadingSpinner = ({ type = "page", size = 36 }) => {
  if (type === "home") {
    return (
      <Box sx={{ width: "100%", pb: 6 }}>
        {/* Hero Banner Skeleton */}
        <Box
          sx={{
            width: "100%",
            height: { xs: 500, md: 600 },
            backgroundColor: "#0f172a",
            borderRadius: { xs: 0, md: "0 0 24px 24px" },
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              maxWidth: "1320px",
              width: "100%",
              mx: "auto",
              px: 3,
            }}
          >
            <Box sx={{ maxWidth: 680, width: "100%" }}>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={175}
                height={32}
                sx={{
                  borderRadius: "9999px",
                  bgcolor: "rgba(255, 255, 255, 0.14)",
                  mb: 2.5,
                }}
              />
              <Skeleton
                animation="wave"
                variant="text"
                sx={{
                  width: "88%",
                  height: { xs: 42, md: 54 },
                  bgcolor: "rgba(255, 255, 255, 0.16)",
                }}
              />
              <Skeleton
                animation="wave"
                variant="text"
                sx={{
                  width: "62%",
                  height: { xs: 42, md: 54 },
                  bgcolor: "rgba(255, 255, 255, 0.16)",
                  mb: 2,
                }}
              />
              <Skeleton
                animation="wave"
                variant="text"
                sx={{
                  width: "82%",
                  height: 20,
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                }}
              />
              <Skeleton
                animation="wave"
                variant="text"
                sx={{
                  width: "56%",
                  height: 20,
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  mb: 3.5,
                }}
              />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3.5 }}>
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={170}
                  height={48}
                  sx={{
                    borderRadius: "9999px",
                    bgcolor: "rgba(34, 197, 94, 0.35)",
                  }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={160}
                  height={48}
                  sx={{
                    borderRadius: "9999px",
                    bgcolor: "rgba(255, 255, 255, 0.16)",
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton
                    key={idx}
                    animation="wave"
                    variant="rounded"
                    width={130}
                    height={36}
                    sx={{
                      borderRadius: "9999px",
                      bgcolor: "rgba(255, 255, 255, 0.12)",
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Overlapping Features Strip Skeleton */}
        <Box
          sx={{
            maxWidth: "1320px",
            width: "100%",
            mx: "auto",
            px: 3,
            mt: "-35px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2.5,
            }}
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  p: "1.35rem 1.25rem",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={48}
                  height={48}
                  sx={{ borderRadius: "12px", flexShrink: 0 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Skeleton animation="wave" variant="text" width="68%" height={22} />
                  <Skeleton animation="wave" variant="text" width="90%" height={16} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Menu Showcase Skeleton */}
        <Box
          sx={{
            maxWidth: "1320px",
            width: "100%",
            mx: "auto",
            px: 3,
            mt: 6,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={140}
              height={28}
              sx={{ borderRadius: "9999px", mb: 1.25 }}
            />
            <Skeleton
              animation="wave"
              variant="text"
              sx={{ width: { xs: "65%", sm: 300 }, height: 38, mb: 0.5 }}
            />
            <Skeleton
              animation="wave"
              variant="text"
              sx={{ width: { xs: "85%", sm: 420 }, height: 20 }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2.5,
            }}
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  backgroundColor: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)",
                }}
              >
                <Skeleton animation="wave" variant="rectangular" height={185} />
                <Box sx={{ p: 2 }}>
                  <Skeleton
                    animation="wave"
                    variant="text"
                    width="72%"
                    height={24}
                    sx={{ mb: 0.75 }}
                  />
                  <Skeleton animation="wave" variant="text" width="92%" height={16} />
                  <Skeleton
                    animation="wave"
                    variant="text"
                    width="64%"
                    height={16}
                    sx={{ mb: 2 }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Skeleton animation="wave" variant="text" width={64} height={24} />
                    <Skeleton
                      animation="wave"
                      variant="rounded"
                      width={88}
                      height={34}
                      sx={{ borderRadius: "9999px" }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

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
