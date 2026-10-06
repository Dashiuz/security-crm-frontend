"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Button,
  Divider,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  NotificationsOutlined as BellIcon,
  NotificationsActive as BellActiveIcon,
  AssignmentInd as PqrsAssignIcon,
  Feedback as PqrsIcon,
  CheckCircleOutline as ReadIcon,
  DoneAll as MarkAllReadIcon,
} from "@mui/icons-material";
import {
  NotificationItem,
  NotificationsApi,
} from "@/lib/api/notifications";
import { formatDateTime } from "@/lib/formatters";

export default function NotificationBell() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [markingAll, setMarkingAll] = useState<boolean>(false);

  const fetchUnread = useCallback(async () => {
    try {
      setLoading(true);
      const res = await NotificationsApi.getUnread();
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // Ignore background fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();

    // Escuchar notificaciones recibidas en tiempo real vía SSE
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      if (customEvent.detail) {
        setNotifications((prev) => [customEvent.detail, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } else {
        fetchUnread();
      }
    };

    window.addEventListener("app:notification", handleNewNotification);
    return () => {
      window.removeEventListener("app:notification", handleNewNotification);
    };
  }, [fetchUnread]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchUnread();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = async (notif: NotificationItem) => {
    try {
      if (!notif.isRead) {
        await NotificationsApi.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Ignore error
    }

    handleClose();
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await NotificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore error
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PQRS_ASSIGNED":
        return <PqrsAssignIcon color="primary" fontSize="small" />;
      case "PQRS_UPDATED":
        return <PqrsIcon color="secondary" fontSize="small" />;
      default:
        return <PqrsIcon color="action" fontSize="small" />;
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={unreadCount > 0 ? `${unreadCount} notificaciones nuevas` : "Notificaciones"}>
        <IconButton
          onClick={handleOpen}
          sx={{
            color: "inherit",
            p: 1,
            mr: 1,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.15)",
            },
          }}
          aria-label="notificaciones"
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? (
              <BellActiveIcon sx={{ fontSize: 24 }} />
            ) : (
              <BellIcon sx={{ fontSize: 24 }} />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 320, sm: 380 },
              maxHeight: 480,
              mt: 1.5,
              borderRadius: 3,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700}>
              Notificaciones
            </Typography>
            {unreadCount > 0 && (
              <Typography
                variant="caption"
                sx={{
                  bgcolor: "primary.main",
                  color: "#ffffff",
                  px: 1,
                  py: 0.2,
                  borderRadius: 2,
                  fontWeight: 700,
                }}
              >
                {unreadCount} nuevas
              </Typography>
            )}
          </Stack>

          {unreadCount > 0 && (
            <Button
              size="small"
              variant="text"
              startIcon={
                markingAll ? (
                  <CircularProgress size={12} color="inherit" />
                ) : (
                  <MarkAllReadIcon fontSize="small" />
                )
              }
              onClick={handleMarkAllRead}
              disabled={markingAll}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                fontWeight: 600,
                py: 0.2,
                px: 1,
              }}
            >
              Marcar leídas
            </Button>
          )}
        </Box>

        {/* Content */}
        {loading && notifications.length === 0 ? (
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <ReadIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              No tienes notificaciones pendientes
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.map((notif, index) => (
              <Box key={notif.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleItemClick(notif)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      alignItems: "flex-start",
                      bgcolor: notif.isRead ? "transparent" : "action.hover",
                      "&:hover": {
                        bgcolor: notif.isRead
                          ? "action.hover"
                          : "action.selected",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                      {getNotificationIcon(notif.type)}
                    </ListItemIcon>
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography
                          variant="body2"
                          fontWeight={notif.isRead ? 500 : 700}
                          color="text.primary"
                        >
                          {notif.title}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="div"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              lineHeight: 1.3,
                            }}
                          >
                            {notif.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            component="div"
                            sx={{
                              fontSize: "0.68rem",
                              color: "text.disabled",
                              mt: 0.25,
                            }}
                          >
                            {formatDateTime(notif.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
