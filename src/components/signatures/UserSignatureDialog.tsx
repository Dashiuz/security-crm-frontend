"use client";

import React from "react";
import UserSignatureDrawer, {
  UserSignatureDrawerProps,
  SignatureCreationMode,
  CALLIGRAPHIC_FONTS,
} from "./UserSignatureDrawer";

export type { SignatureCreationMode };
export type UserSignatureDialogProps = UserSignatureDrawerProps;
export { CALLIGRAPHIC_FONTS };

/**
 * UserSignatureDialog se mapea a UserSignatureDrawer para cumplir con
 * la regla de diseño de Noxia: uso de Drawers laterales/inferiores en interacciones densas.
 */
export default function UserSignatureDialog(props: UserSignatureDialogProps) {
  return <UserSignatureDrawer {...props} />;
}
