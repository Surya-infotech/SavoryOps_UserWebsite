import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

/**
 * Shared container shell aligning route skeletons with each page's Breadcrumbs + content width.
 */
const PageShell = ({
  showBreadcrumb = true,
  breadcrumbWidth = 210,
  maxWidth = "1320px",
  children,
}) => (
  <Box
    sx={{
      maxWidth,
      width: "100%",
      mx: "auto",
      px: showBreadcrumb ? 3 : 0,
      pt: showBreadcrumb ? 3 : 0,
      pb: showBreadcrumb ? 6 : 0,
      boxSizing: "border-box",
    }}
  >
    {showBreadcrumb && (
      <Skeleton
        animation="wave"
        variant="rounded"
        width={breadcrumbWidth}
        height={36}
        sx={{ borderRadius: "9999px", mb: 2.5 }}
      />
    )}
    {children}
  </Box>
);

/**
 * Shared white elevated card surface with optional top green accent bar.
 */
const SurfaceCard = ({ radius = "20px", accent = false, sx = {}, children }) => (
  <Box
    sx={{
      backgroundColor: "#ffffff",
      borderRadius: radius,
      border: "1px solid var(--border-color, #e2e8f0)",
      boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {accent && (
      <Box
        sx={{
          height: 4,
          width: "100%",
          background:
            "linear-gradient(90deg, rgba(2, 136, 2, 0.35) 0%, rgba(34, 197, 94, 0.35) 100%)",
        }}
      />
    )}
    {children}
  </Box>
);

/**
 * Shared responsive dish/offer card grid used by Home showcase, Menu, and Offers pages.
 */
const DishGridSkeleton = ({ count = 8 }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, 1fr)",
        md: "repeat(3, 1fr)",
        lg: "repeat(4, 1fr)",
      },
      gap: 2.5,
    }}
  >
    {Array.from({ length: count }).map((_, idx) => (
      <SurfaceCard key={idx} radius="18px">
        <Skeleton animation="wave" variant="rectangular" height={185} />
        <Box sx={{ p: 2 }}>
          <Skeleton animation="wave" variant="text" width="72%" height={24} sx={{ mb: 0.75 }} />
          <Skeleton animation="wave" variant="text" width="92%" height={16} />
          <Skeleton animation="wave" variant="text" width="64%" height={16} sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
      </SurfaceCard>
    ))}
  </Box>
);

/**
 * Shared right-hand Bill / Order Summary card used by Cart, Checkout, and Order Details.
 */
const SummarySideCard = ({ rows = 5, hasButton = true, buttonHeight = 46 }) => (
  <Box>
    <Skeleton animation="wave" variant="text" width={130} height={26} sx={{ mb: 1.5 }} />
    <SurfaceCard accent>
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <Box
            key={idx}
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
          >
            <Skeleton animation="wave" variant="text" width="48%" height={18} />
            <Skeleton animation="wave" variant="text" width={68} height={18} />
          </Box>
        ))}
        <Box sx={{ height: "1px", bgcolor: "#f1f5f9", my: 0.5 }} />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Skeleton animation="wave" variant="text" width={105} height={26} />
          <Skeleton animation="wave" variant="text" width={88} height={26} />
        </Box>
        {hasButton && (
          <Skeleton
            animation="wave"
            variant="rounded"
            height={buttonHeight}
            sx={{
              borderRadius: "14px",
              bgcolor: "rgba(2, 136, 2, 0.14)",
              mt: 1,
            }}
          />
        )}
      </Box>
    </SurfaceCard>
  </Box>
);

/**
 * Shared avatar + 2 metadata lines block used in Reservation, Order, and Review cards.
 */
const IdentityMetaRow = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
    <Skeleton
      animation="wave"
      variant="rounded"
      width={44}
      height={44}
      sx={{ borderRadius: "12px", flexShrink: 0 }}
    />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Skeleton animation="wave" variant="text" width="75%" height={20} />
      <Skeleton animation="wave" variant="text" width="52%" height={15} />
    </Box>
  </Box>
);

/**
 * Home Page (/) skeleton matching HomeBanner, overlapping HomeFeatures, and HomeMenuShowcase.
 */
export const HomeSkeleton = () => (
  <Box sx={{ width: "100%", pb: 6 }}>
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
      <Box sx={{ maxWidth: "1320px", width: "100%", mx: "auto", px: 3 }}>
        <Box sx={{ maxWidth: 680, width: "100%" }}>
          <Skeleton
            animation="wave"
            variant="rounded"
            width={175}
            height={32}
            sx={{ borderRadius: "9999px", bgcolor: "rgba(255, 255, 255, 0.14)", mb: 2.5 }}
          />
          <Skeleton
            animation="wave"
            variant="text"
            sx={{ width: "88%", height: { xs: 42, md: 54 }, bgcolor: "rgba(255, 255, 255, 0.16)" }}
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
            sx={{ width: "82%", height: 20, bgcolor: "rgba(255, 255, 255, 0.12)" }}
          />
          <Skeleton
            animation="wave"
            variant="text"
            sx={{ width: "56%", height: 20, bgcolor: "rgba(255, 255, 255, 0.12)", mb: 3.5 }}
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3.5 }}>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={170}
              height={48}
              sx={{ borderRadius: "9999px", bgcolor: "rgba(34, 197, 94, 0.35)" }}
            />
            <Skeleton
              animation="wave"
              variant="rounded"
              width={160}
              height={48}
              sx={{ borderRadius: "9999px", bgcolor: "rgba(255, 255, 255, 0.16)" }}
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
                sx={{ borderRadius: "9999px", bgcolor: "rgba(255, 255, 255, 0.12)" }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>

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
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2.5,
        }}
      >
        {Array.from({ length: 4 }).map((_, idx) => (
          <SurfaceCard
            key={idx}
            radius="16px"
            sx={{
              p: "1.35rem 1.25rem",
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
          </SurfaceCard>
        ))}
      </Box>
    </Box>

    <Box sx={{ maxWidth: "1320px", width: "100%", mx: "auto", px: 3, mt: 6 }}>
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
        <Skeleton animation="wave" variant="text" sx={{ width: { xs: "85%", sm: 420 }, height: 20 }} />
      </Box>
      <DishGridSkeleton count={4} />
    </Box>
  </Box>
);

/**
 * Reservation List (/reservation) skeleton matching right CTA button + 3-column reservation card grid.
 */
export const ReservationListSkeleton = ({ showBreadcrumb = true }) => (
  <PageShell showBreadcrumb={showBreadcrumb} breadcrumbWidth={230}>
    <Box
      sx={{
        display: "flex",
        justifyContent: { xs: "stretch", md: "flex-end" },
        mb: 3,
      }}
    >
      <Skeleton
        animation="wave"
        variant="rounded"
        sx={{
          width: { xs: "100%", sm: 190 },
          height: 44,
          borderRadius: "12px",
          bgcolor: "rgba(2, 136, 2, 0.14)",
        }}
      />
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fill, minmax(360px, 1fr))" },
        gap: 3,
      }}
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <SurfaceCard key={idx} accent>
          <Box sx={{ p: "1.25rem 1.35rem", display: "flex", flexDirection: "column", gap: 1.75 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <IdentityMetaRow />
              <Skeleton
                animation="wave"
                variant="rounded"
                width={86}
                height={26}
                sx={{ borderRadius: "9999px", flexShrink: 0 }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={130}
                height={26}
                sx={{ borderRadius: "8px" }}
              />
              <Skeleton
                animation="wave"
                variant="rounded"
                width={90}
                height={26}
                sx={{ borderRadius: "8px" }}
              />
            </Box>

            <Box sx={{ height: "1px", bgcolor: "#f1f5f9" }} />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              {Array.from({ length: 2 }).map((__, colIdx) => (
                <Box key={colIdx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Skeleton
                    animation="wave"
                    variant="rounded"
                    width={36}
                    height={36}
                    sx={{ borderRadius: "10px", flexShrink: 0 }}
                  />
                  <Skeleton animation="wave" variant="text" width="65%" height={18} />
                </Box>
              ))}
            </Box>
          </Box>
        </SurfaceCard>
      ))}
    </Box>
  </PageShell>
);

/**
 * Reservation Details (/reservationdetails/:id) skeleton matching nav header, overview card, and booking card.
 */
export const ReservationDetailSkeleton = ({ showBreadcrumb = true }) => (
  <PageShell showBreadcrumb={showBreadcrumb} breadcrumbWidth={285}>
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
      }}
    >
      <Skeleton animation="wave" variant="text" width={220} height={34} />
      <Skeleton
        animation="wave"
        variant="rounded"
        width={190}
        height={38}
        sx={{ borderRadius: "9999px" }}
      />
    </Box>

    <SurfaceCard accent sx={{ mb: 3 }}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            pb: 2,
            mb: 2.5,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={100}
              height={30}
              sx={{ borderRadius: "9999px" }}
            />
            <Skeleton
              animation="wave"
              variant="rounded"
              width={90}
              height={30}
              sx={{ borderRadius: "9999px" }}
            />
          </Box>
          <Skeleton animation="wave" variant="text" width={160} height={20} />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {Array.from({ length: 3 }).map((_, idx) => (
            <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={40}
                height={40}
                sx={{ borderRadius: "10px", flexShrink: 0 }}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton animation="wave" variant="text" width="70%" height={20} />
                <Skeleton animation="wave" variant="text" width="48%" height={14} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </SurfaceCard>

    <Skeleton animation="wave" variant="text" width={175} height={26} sx={{ mb: 1.5 }} />
    <SurfaceCard accent>
      <Box
        sx={{
          p: 3,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 2.5,
        }}
      >
        {Array.from({ length: 4 }).map((_, idx) => (
          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={38}
              height={38}
              sx={{ borderRadius: "10px", flexShrink: 0 }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton animation="wave" variant="text" width="42%" height={14} />
              <Skeleton animation="wave" variant="text" width="68%" height={20} />
            </Box>
          </Box>
        ))}
      </Box>
    </SurfaceCard>
  </PageShell>
);

/**
 * Menu (/menu) & Offers (/offers) skeleton matching top filter bar and 4-column dish card grid.
 */
export const CatalogSkeleton = ({ variant = "menu" }) => (
  <PageShell breadcrumbWidth={variant === "offers" ? 195 : 175}>
    <SurfaceCard radius="14px" sx={{ p: "0.65rem 1rem", mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: variant === "offers" ? "flex-start" : "space-between",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.25,
            flex: variant === "offers" ? "0 1 auto" : 1,
          }}
        >
          {variant === "offers" ? (
            [105, 95, 130].map((w, idx) => (
              <Skeleton
                key={idx}
                animation="wave"
                variant="rounded"
                width={w}
                height={38}
                sx={{ borderRadius: "10px" }}
              />
            ))
          ) : (
            [200, 230].map((w, idx) => (
              <Skeleton
                key={idx}
                animation="wave"
                variant="rounded"
                sx={{ width: { xs: "100%", sm: w }, height: 40, borderRadius: "10px" }}
              />
            ))
          )}
        </Box>

        <Skeleton
          animation="wave"
          variant="rounded"
          width={200}
          height={38}
          sx={{ borderRadius: "10px" }}
        />
      </Box>
    </SurfaceCard>

    <DishGridSkeleton count={8} />
  </PageShell>
);

/**
 * Orders List (/orders) skeleton matching right-aligned search pill and order card structure.
 */
export const OrderListSkeleton = ({ showBreadcrumb = true }) => (
  <PageShell showBreadcrumb={showBreadcrumb} breadcrumbWidth={185}>
    <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", mb: 3 }}>
      <Skeleton
        animation="wave"
        variant="rounded"
        sx={{ width: "100%", maxWidth: 480, height: 46, borderRadius: "9999px" }}
      />
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fill, minmax(360px, 1fr))" },
        gap: 3,
      }}
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <SurfaceCard key={idx} accent>
          <Box sx={{ p: "1.25rem 1.35rem 0.95rem", display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={82}
                  height={28}
                  sx={{ borderRadius: "9999px" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={86}
                  height={28}
                  sx={{ borderRadius: "9999px" }}
                />
              </Box>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={90}
                height={28}
                sx={{ borderRadius: "9999px" }}
              />
            </Box>

            <IdentityMetaRow />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: "0.55rem 0.8rem",
                border: "1px solid #f1f5f9",
                borderRadius: "12px",
              }}
            >
              <Skeleton animation="wave" variant="rounded" width={58} height={22} sx={{ borderRadius: "6px" }} />
              <Skeleton animation="wave" variant="text" width="60%" height={18} />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                pt: 1.5,
                borderTop: "1px dashed #e2e8f0",
              }}
            >
              <Skeleton
                animation="wave"
                variant="rounded"
                width={78}
                height={24}
                sx={{ borderRadius: "9999px" }}
              />
              <Skeleton animation="wave" variant="text" width={130} height={18} />
            </Box>
          </Box>

          <Box
            sx={{
              p: "0.95rem 1.35rem",
              background: "linear-gradient(180deg, #fbfcfd 0%, #f8fafc 100%)",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Skeleton animation="wave" variant="text" width={88} height={26} />
            <Skeleton animation="wave" variant="circular" width={38} height={38} />
          </Box>
        </SurfaceCard>
      ))}
    </Box>
  </PageShell>
);

/**
 * Order Details (/orderdetails/:id) skeleton matching 2-column order overview + items + bill panel.
 */
export const OrderDetailSkeleton = ({ showBreadcrumb = true }) => (
  <PageShell showBreadcrumb={showBreadcrumb} breadcrumbWidth={260}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 380px" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Skeleton animation="wave" variant="text" width={200} height={34} />
          <Skeleton
            animation="wave"
            variant="rounded"
            width={175}
            height={38}
            sx={{ borderRadius: "9999px" }}
          />
        </Box>

        <SurfaceCard accent>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 1.5,
                pb: 2,
                mb: 2,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <Box sx={{ display: "flex", gap: 1.25 }}>
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={95}
                  height={28}
                  sx={{ borderRadius: "9999px" }}
                />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={85}
                  height={28}
                  sx={{ borderRadius: "9999px" }}
                />
              </Box>
              <Skeleton animation="wave" variant="text" width={150} height={20} />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {Array.from({ length: 3 }).map((_, idx) => (
                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Skeleton
                    animation="wave"
                    variant="rounded"
                    width={40}
                    height={40}
                    sx={{ borderRadius: "10px", flexShrink: 0 }}
                  />
                  <Skeleton animation="wave" variant="text" width="68%" height={20} />
                </Box>
              ))}
            </Box>
          </Box>
        </SurfaceCard>

        <Box>
          <Skeleton animation="wave" variant="text" width={145} height={26} sx={{ mb: 1.5 }} />
          <SurfaceCard accent>
            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
                    <Skeleton animation="wave" variant="rounded" width={14} height={14} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton animation="wave" variant="text" width="55%" height={20} />
                      <Skeleton animation="wave" variant="text" width="28%" height={15} />
                    </Box>
                  </Box>
                  <Skeleton
                    animation="wave"
                    variant="rounded"
                    width={52}
                    height={26}
                    sx={{ borderRadius: "9999px" }}
                  />
                  <Skeleton animation="wave" variant="text" width={64} height={22} />
                </Box>
              ))}
            </Box>
          </SurfaceCard>
        </Box>
      </Box>

      <SummarySideCard rows={5} buttonHeight={48} />
    </Box>
  </PageShell>
);

/**
 * Cart (/cart) skeleton matching order meta chips + cart item cards on left and Bill Summary on right.
 */
export const CartSkeleton = () => (
  <PageShell breadcrumbWidth={170}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 390px" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 0.5 }}>
          <Skeleton animation="wave" variant="rounded" width={135} height={42} sx={{ borderRadius: "12px" }} />
          <Skeleton animation="wave" variant="rounded" width={125} height={42} sx={{ borderRadius: "12px" }} />
        </Box>

        {Array.from({ length: 3 }).map((_, idx) => (
          <SurfaceCard key={idx} radius="18px">
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={88}
                height={88}
                sx={{ borderRadius: "14px", flexShrink: 0 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton animation="wave" variant="text" width="58%" height={22} />
                <Skeleton animation="wave" variant="text" width="38%" height={16} sx={{ mb: 1 }} />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                  <Skeleton animation="wave" variant="text" width={72} height={22} />
                  <Skeleton
                    animation="wave"
                    variant="rounded"
                    width={96}
                    height={32}
                    sx={{ borderRadius: "9999px" }}
                  />
                </Box>
              </Box>
            </Box>
          </SurfaceCard>
        ))}
      </Box>

      <SummarySideCard rows={4} buttonHeight={48} />
    </Box>
  </PageShell>
);

/**
 * Checkout (/checkout) skeleton matching address + payment method cards on left and Bill Summary on right.
 */
export const CheckoutSkeleton = () => (
  <PageShell breadcrumbWidth={220}>
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Skeleton animation="wave" variant="text" width={150} height={34} />
        <Skeleton animation="wave" variant="rounded" width={110} height={30} sx={{ borderRadius: "9999px" }} />
      </Box>
      <Skeleton animation="wave" variant="rounded" width={145} height={38} sx={{ borderRadius: "12px" }} />
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1fr 400px" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <SurfaceCard>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Skeleton animation="wave" variant="text" width={165} height={24} />
              <Skeleton animation="wave" variant="rounded" width={120} height={32} sx={{ borderRadius: "10px" }} />
            </Box>
            <Skeleton animation="wave" variant="rounded" height={86} sx={{ borderRadius: "14px" }} />
          </Box>
        </SurfaceCard>

        <SurfaceCard>
          <Box sx={{ p: 3 }}>
            <Skeleton animation="wave" variant="text" width={165} height={24} sx={{ mb: 2 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Skeleton animation="wave" variant="rounded" height={72} sx={{ borderRadius: "14px" }} />
              <Skeleton animation="wave" variant="rounded" height={72} sx={{ borderRadius: "14px" }} />
            </Box>
          </Box>
        </SurfaceCard>
      </Box>

      <SummarySideCard rows={5} buttonHeight={48} />
    </Box>
  </PageShell>
);

/**
 * Manage Address (/manage-address) skeleton matching top action bar + 3-column address card grid.
 */
export const AddressListSkeleton = () => (
  <PageShell breadcrumbWidth={260}>
    <Box sx={{ display: "flex", justifyContent: { xs: "stretch", md: "flex-end" }, mb: 3 }}>
      <Skeleton
        animation="wave"
        variant="rounded"
        sx={{
          width: { xs: "100%", sm: 175 },
          height: 44,
          borderRadius: "12px",
          bgcolor: "rgba(2, 136, 2, 0.14)",
        }}
      />
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fill, minmax(320px, 1fr))" },
        gap: 3,
      }}
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <SurfaceCard key={idx}>
          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Skeleton animation="wave" variant="rounded" width={88} height={28} sx={{ borderRadius: "9999px" }} />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Skeleton animation="wave" variant="circular" width={34} height={34} />
                <Skeleton animation="wave" variant="circular" width={34} height={34} />
              </Box>
            </Box>
            <Skeleton animation="wave" variant="text" width="88%" height={20} />
            <Skeleton animation="wave" variant="text" width="66%" height={16} />
            <Skeleton animation="wave" variant="rounded" width={95} height={26} sx={{ borderRadius: "8px", mt: 0.5 }} />
          </Box>
        </SurfaceCard>
      ))}
    </Box>
  </PageShell>
);

/**
 * My Reviews (/my-reviews) skeleton matching 3-column review card grid.
 */
export const ReviewsListSkeleton = () => (
  <PageShell breadcrumbWidth={240}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fill, minmax(340px, 1fr))" },
        gap: 3,
      }}
    >
      {Array.from({ length: 6 }).map((_, idx) => (
        <SurfaceCard key={idx} accent>
          <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Skeleton animation="wave" variant="rounded" width={82} height={26} sx={{ borderRadius: "8px" }} />
              <Skeleton animation="wave" variant="rounded" width={110} height={20} />
            </Box>
            <IdentityMetaRow />
            <Skeleton animation="wave" variant="rounded" height={64} sx={{ borderRadius: "12px" }} />
            <Skeleton animation="wave" variant="text" width={115} height={16} />
          </Box>
        </SurfaceCard>
      ))}
    </Box>
  </PageShell>
);

/**
 * Notifications (/notifications) skeleton matching top action row + vertical notification card stack.
 */
export const NotificationsListSkeleton = () => (
  <PageShell breadcrumbWidth={210}>
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2.5 }}>
      <Skeleton animation="wave" variant="rounded" width={120} height={38} sx={{ borderRadius: "10px" }} />
    </Box>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {Array.from({ length: 5 }).map((_, idx) => (
        <SurfaceCard key={idx} accent>
          <Box sx={{ p: 2.25, display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Skeleton animation="wave" variant="circular" width={36} height={36} />
                <Skeleton animation="wave" variant="rounded" width={82} height={22} sx={{ borderRadius: "9999px" }} />
              </Box>
              <Skeleton animation="wave" variant="text" width={68} height={16} />
            </Box>
            <Skeleton animation="wave" variant="text" width="76%" height={20} />
            <Skeleton animation="wave" variant="text" width="92%" height={16} />
          </Box>
        </SurfaceCard>
      ))}
    </Box>
  </PageShell>
);

/**
 * Profile (/profile) skeleton matching header banner (avatar + completion badge),
 * 3-column 9-field form grid, and footer actions.
 */
export const ProfileSkeleton = ({ showBreadcrumb = true }) => (
  <PageShell showBreadcrumb={showBreadcrumb} breadcrumbWidth={205}>
    <SurfaceCard>
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          <Skeleton animation="wave" variant="circular" width={88} height={88} sx={{ flexShrink: 0 }} />
          <Box>
            <Skeleton animation="wave" variant="text" width={190} height={28} />
            <Skeleton animation="wave" variant="text" width={220} height={18} sx={{ mb: 1 }} />
            <Skeleton animation="wave" variant="rounded" width={140} height={34} sx={{ borderRadius: "10px" }} />
          </Box>
        </Box>
        <Skeleton animation="wave" variant="rounded" width={190} height={68} sx={{ borderRadius: "16px" }} />
      </Box>

      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2.5,
            mb: 3,
          }}
        >
          {Array.from({ length: 9 }).map((_, idx) => (
            <Box key={idx}>
              <Skeleton animation="wave" variant="text" width={110} height={18} sx={{ mb: 0.75 }} />
              <Skeleton animation="wave" variant="rounded" height={46} sx={{ borderRadius: "12px" }} />
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Skeleton animation="wave" variant="rounded" width={120} height={44} sx={{ borderRadius: "12px" }} />
          <Skeleton
            animation="wave"
            variant="rounded"
            width={165}
            height={44}
            sx={{ borderRadius: "12px", bgcolor: "rgba(2, 136, 2, 0.14)" }}
          />
        </Box>
      </Box>
    </SurfaceCard>
  </PageShell>
);

/**
 * Settings (/settings) skeleton matching left 2-tab sidebar and right datetime form panel.
 */
export const SettingsSkeleton = () => (
  <PageShell breadcrumbWidth={195}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "290px 1fr" },
        gap: 3,
        alignItems: "start",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Array.from({ length: 2 }).map((_, idx) => (
          <SurfaceCard key={idx} radius="16px" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Skeleton animation="wave" variant="rounded" width={40} height={40} sx={{ borderRadius: "10px" }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton animation="wave" variant="text" width="70%" height={20} />
                <Skeleton animation="wave" variant="text" width="52%" height={14} />
              </Box>
            </Box>
          </SurfaceCard>
        ))}
      </Box>

      <SurfaceCard sx={{ p: 3 }}>
        <Skeleton animation="wave" variant="rounded" height={76} sx={{ borderRadius: "14px", mb: 3 }} />
        <Skeleton animation="wave" variant="text" width={100} height={18} sx={{ mb: 0.75 }} />
        <Skeleton animation="wave" variant="rounded" height={46} sx={{ borderRadius: "12px", mb: 2.5 }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5, mb: 3 }}>
          {Array.from({ length: 2 }).map((_, idx) => (
            <Box key={idx}>
              <Skeleton animation="wave" variant="text" width={110} height={18} sx={{ mb: 0.75 }} />
              <Skeleton animation="wave" variant="rounded" height={46} sx={{ borderRadius: "12px" }} />
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Skeleton
            animation="wave"
            variant="rounded"
            width={165}
            height={44}
            sx={{ borderRadius: "12px", bgcolor: "rgba(2, 136, 2, 0.14)" }}
          />
        </Box>
      </SurfaceCard>
    </Box>
  </PageShell>
);

/**
 * About (/about) skeleton matching hero split section and 3 pillar cards row.
 */
export const AboutSkeleton = () => (
  <Box sx={{ pb: 6 }}>
    <Box
      sx={{
        backgroundColor: "#ffffff",
        pb: 5,
      }}
    >
      <PageShell breadcrumbWidth={190} showBreadcrumb>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 420px" },
            gap: 4,
            alignItems: "center",
          }}
        >
          <Box>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={150}
              height={30}
              sx={{ borderRadius: "9999px", mb: 2 }}
            />
            <Skeleton animation="wave" variant="text" width="82%" height={46} />
            <Skeleton animation="wave" variant="text" width="56%" height={46} sx={{ mb: 2 }} />
            <Skeleton animation="wave" variant="text" width="90%" height={20} />
            <Skeleton animation="wave" variant="text" width="68%" height={20} sx={{ mb: 3 }} />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  animation="wave"
                  variant="rounded"
                  width={125}
                  height={36}
                  sx={{ borderRadius: "9999px" }}
                />
              ))}
            </Box>
          </Box>
          <Skeleton animation="wave" variant="rounded" height={300} sx={{ borderRadius: "24px" }} />
        </Box>
      </PageShell>
    </Box>

    <Box sx={{ maxWidth: "1320px", width: "100%", mx: "auto", px: 3, mt: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <SurfaceCard key={idx} sx={{ p: 3 }}>
            <Skeleton
              animation="wave"
              variant="rounded"
              width={48}
              height={48}
              sx={{ borderRadius: "12px", mb: 2 }}
            />
            <Skeleton animation="wave" variant="text" width="62%" height={24} sx={{ mb: 1 }} />
            <Skeleton animation="wave" variant="text" width="95%" height={16} />
            <Skeleton animation="wave" variant="text" width="75%" height={16} />
          </SurfaceCard>
        ))}
      </Box>
    </Box>
  </Box>
);

/**
 * Policy (/policy) skeleton matching policy tab chips, header banner, and document card.
 */
export const PolicySkeleton = ({ showBreadcrumb = true }) => (
  <PageShell showBreadcrumb={showBreadcrumb} breadcrumbWidth={210}>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mb: 2.5 }}>
      {[140, 155, 130].map((w, idx) => (
        <Skeleton
          key={idx}
          animation="wave"
          variant="rounded"
          width={w}
          height={38}
          sx={{ borderRadius: "9999px" }}
        />
      ))}
    </Box>

    <SurfaceCard sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Skeleton animation="wave" variant="rounded" width={54} height={54} sx={{ borderRadius: "14px" }} />
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
            <Skeleton animation="wave" variant="rounded" width={120} height={24} sx={{ borderRadius: "9999px" }} />
            <Skeleton animation="wave" variant="rounded" width={140} height={24} sx={{ borderRadius: "9999px" }} />
          </Box>
          <Skeleton animation="wave" variant="text" width="45%" height={20} />
        </Box>
      </Box>
    </SurfaceCard>

    <SurfaceCard sx={{ p: 3.5 }}>
      <Skeleton animation="wave" variant="text" width="38%" height={30} sx={{ mb: 2 }} />
      {["96%", "92%", "88%", "64%", "94%", "90%", "78%"].map((w, idx) => (
        <Skeleton
          key={idx}
          animation="wave"
          variant="text"
          width={w}
          height={18}
          sx={{ mb: idx === 3 ? 2.5 : 1 }}
        />
      ))}
      <Box
        sx={{
          pt: 2.5,
          mt: 2.5,
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Skeleton animation="wave" variant="rounded" width={40} height={40} sx={{ borderRadius: "10px" }} />
          <Box>
            <Skeleton animation="wave" variant="text" width={140} height={18} />
            <Skeleton animation="wave" variant="text" width={190} height={14} />
          </Box>
        </Box>
        <Skeleton animation="wave" variant="text" width={150} height={18} />
      </Box>
    </SurfaceCard>
  </PageShell>
);

/**
 * Sign-in (/signin) skeleton matching centered auth card.
 */
export const SigninSkeleton = () => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "#ffffff",
      p: 2,
    }}
  >
    <SurfaceCard radius="24px" sx={{ maxWidth: 460, width: "100%", p: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
        <Skeleton animation="wave" variant="circular" width={64} height={64} sx={{ mb: 2 }} />
        <Skeleton animation="wave" variant="text" width="60%" height={32} />
        <Skeleton animation="wave" variant="text" width="80%" height={18} />
      </Box>
      <Skeleton animation="wave" variant="text" width={135} height={18} sx={{ mb: 1 }} />
      <Skeleton animation="wave" variant="rounded" height={50} sx={{ borderRadius: "14px", mb: 2.5 }} />
      <Skeleton
        animation="wave"
        variant="rounded"
        height={48}
        sx={{ borderRadius: "14px", bgcolor: "rgba(2, 136, 2, 0.14)" }}
      />
    </SurfaceCard>
  </Box>
);

/**
 * Generic detail fallback skeleton.
 */
export const DetailSkeleton = () => (
  <SurfaceCard radius="16px" sx={{ p: 3 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 2.5,
        pb: 2,
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
    </Box>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 2,
        mb: 2.5,
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
    </Box>
    <Skeleton animation="wave" variant="rounded" height={180} sx={{ borderRadius: "12px" }} />
  </SurfaceCard>
);

/**
 * Fallback skeleton for miscellaneous or unknown routes.
 */
export const DefaultPageSkeleton = () => (
  <PageShell breadcrumbWidth={220}>
    <SurfaceCard radius="16px" sx={{ p: 3 }}>
      <Skeleton animation="wave" variant="text" width="38%" height={34} sx={{ mb: 2 }} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 2,
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
      </Box>
    </SurfaceCard>
  </PageShell>
);