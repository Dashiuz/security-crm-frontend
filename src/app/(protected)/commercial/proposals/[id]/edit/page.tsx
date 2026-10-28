"use client";

import React from "react";
import { useParams } from "next/navigation";
import CanvasProposalWorkspace from "../../components/CanvasProposalWorkspace";

export default function EditProposalPage() {
  const params = useParams();
  const proposalId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

  return <CanvasProposalWorkspace proposalId={proposalId} />;
}
