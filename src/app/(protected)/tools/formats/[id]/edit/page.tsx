"use client";

import React from "react";
import { useParams } from "next/navigation";
import UniversalFormatStudioWorkspace from "../../components/UniversalFormatStudioWorkspace";

export default function EditFormatPage() {
  const params = useParams();
  const formatId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

  return <UniversalFormatStudioWorkspace formatId={formatId} />;
}
