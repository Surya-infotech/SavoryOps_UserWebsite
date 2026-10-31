import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SettingsIcon from "@mui/icons-material/Settings";
import CancelIcon from "@mui/icons-material/Cancel";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";

/**
 * Renders the order status icon matching SavoryOps_UserApp (orderStatusHelpers.js)
 */
export const OrderStatusIcon = ({ status, ...props }) => {
  const norm = String(status || "").trim().toLowerCase();

  switch (norm) {
    case "completed":
      return <CheckCircleIcon {...props} />;
    case "pending":
      return <AccessTimeIcon {...props} />;
    case "confirmed":
      return <CheckCircleIcon {...props} />;
    case "processing":
      return <SettingsIcon {...props} />;
    case "cancelled":
    case "canceled":
      return <CancelIcon {...props} />;
    case "items added":
      return <CheckCircleIcon {...props} />;
    case "items added by waiter":
      return <PlaylistAddIcon {...props} />;
    case "preparing":
      return <SoupKitchenIcon {...props} />;
    case "driver assigned":
      return <AssignmentIndIcon {...props} />;
    case "on the way":
    case "ontheway":
      return <DeliveryDiningIcon {...props} />;
    case "delivered":
      return <CheckCircleIcon {...props} />;
    default:
      return <AccessTimeIcon {...props} />;
  }
};

export default OrderStatusIcon;

