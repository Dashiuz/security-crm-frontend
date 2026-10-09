"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import { Virtuoso } from "react-virtuoso";
import DataTable, { DataTableProps } from "./DataTable";
import UniversalMobileCard from "./UniversalMobileCard";
import { HttpClient, ApiError } from "@/lib/api/client";

export interface ResponsiveDataViewProps<T = Record<string, unknown>>
  extends Omit<DataTableProps, "endpoint" | "rows"> {
  endpoint?: string;
  rows?: T[];
  renderMobileCard?: (item: T) => React.ReactNode;
  fetchFn?: (
    cursor?: string,
  ) => Promise<{ data: T[]; nextCursor: string | null }>;
}

export default function ResponsiveDataView<T extends Record<string, unknown> = Record<string, unknown>>({
  endpoint,
  rows: externalRows,
  renderMobileCard,
  fetchFn,
  refreshTrigger = 0,
  onRefresh,
  loading: externalLoading,
  getRowId,
  ...rest
}: ResponsiveDataViewProps<T>) {
  const [internalItems, setInternalItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingMoreRef = useRef<boolean>(false);

  // Determinar la función de carga principal
  const executeFetch = useCallback(
    async (cursor?: string) => {
      if (fetchFn) {
        return fetchFn(cursor);
      }

      if (endpoint) {
        const separator = endpoint.includes("?") ? "&" : "?";
        const url = cursor
          ? `${endpoint}${separator}cursor=${encodeURIComponent(cursor)}`
          : endpoint;
        const res = await HttpClient.get<
          { data?: T[]; meta?: { nextCursor?: string | null } } | T[]
        >(url);
        const data: T[] = Array.isArray(res) ? res : res?.data || [];
        const nextCursorVal =
          !Array.isArray(res) && res?.meta?.nextCursor ? res.meta.nextCursor : null;
        return { data, nextCursor: nextCursorVal };
      }

      return { data: externalRows || [], nextCursor: null };
    },
    [fetchFn, endpoint, externalRows],
  );

  // Carga inicial o recarga completa por refresh
  const loadInitialData = useCallback(async () => {
    if (externalRows !== undefined && !fetchFn && !endpoint) {
      setInternalItems(externalRows);
      setNextCursor(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await executeFetch(undefined);
      setInternalItems(result.data);
      setNextCursor(result.nextCursor);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Error al cargar la información");
    } finally {
      setLoading(false);
    }
  }, [executeFetch, externalRows, fetchFn, endpoint]);

  // Carga de la siguiente página mediante cursor (Infinite Scroll)
  const handleEndReached = useCallback(async () => {
    if (!nextCursor || isFetchingMoreRef.current || loading || loadingMore) {
      return;
    }

    isFetchingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const result = await executeFetch(nextCursor);
      setInternalItems((prev) => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error("Error al cargar más registros:", err);
    } finally {
      setLoadingMore(false);
      isFetchingMoreRef.current = false;
    }
  }, [nextCursor, loading, loadingMore, executeFetch]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, refreshTrigger]);

  const handleRefresh = useCallback(() => {
    loadInitialData();
    onRefresh?.();
  }, [loadInitialData, onRefresh]);

  const items = externalRows !== undefined && !fetchFn && !endpoint
    ? externalRows
    : internalItems;
  const isGlobalLoading = externalLoading !== undefined ? externalLoading : loading;

  return (
    <Box sx={{ width: "100%" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        {...rest}
        rows={items}
        loading={isGlobalLoading}
        refreshTrigger={refreshTrigger}
        onRefresh={handleRefresh}
        getRowId={getRowId}
        renderMobile={(mobileRows) => (
          <Box sx={{ width: "100%", mt: 1 }}>
            {mobileRows.length === 0 && !isGlobalLoading ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No hay datos disponibles
                </Typography>
              </Box>
            ) : (
              <Virtuoso
                useWindowScroll
                data={mobileRows as T[]}
                endReached={handleEndReached}
                itemContent={(index, item) => (
                  <Box
                    key={getRowId ? getRowId(item) : (item?.id as string) || index}
                    sx={{ mb: 1.5 }}
                  >
                    {renderMobileCard ? (
                      renderMobileCard(item)
                    ) : (
                      <UniversalMobileCard
                        row={item}
                        columns={rest.columns}
                        onView={rest.onView}
                        onEdit={rest.onEdit}
                        onDelete={rest.onDelete}
                        customActions={rest.customActions}
                        deleteIcon={rest.deleteIcon}
                        deleteActionLabel={rest.deleteActionLabel}
                      />
                    )}
                  </Box>
                )}
                components={{
                  Footer: () =>
                    loadingMore ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          py: 2.5,
                        }}
                      >
                        <CircularProgress size={28} />
                      </Box>
                    ) : null,
                }}
              />
            )}
          </Box>
        )}
      />
    </Box>
  );
}
