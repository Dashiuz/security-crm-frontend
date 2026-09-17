"use client";

import React, { ReactNode } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from "@mui/icons-material";

export interface WizardStep {
  label: string;
  description?: string;
  icon?: ReactNode;
  optional?: boolean;
  content: ReactNode;
}

export interface WizardStepperProps {
  steps: WizardStep[];
  activeStep: number;
  onNext: () => void | Promise<boolean | void>;
  onBack: () => void;
  onSubmit?: () => void | Promise<void>;
  isSubmitting?: boolean;
  nextText?: string;
  backText?: string;
  submitText?: string;
  disableNext?: boolean;
  canClickSteps?: boolean;
  onStepClick?: (stepIndex: number) => void;
}

export default function WizardStepper({
  steps,
  activeStep,
  onNext,
  onBack,
  onSubmit,
  isSubmitting = false,
  nextText = "Siguiente",
  backText = "Atrás",
  submitText = "Guardar y Finalizar",
  disableNext = false,
  canClickSteps = false,
  onStepClick,
}: WizardStepperProps) {
  const isLastStep = activeStep === steps.length - 1;

  const handleNextClick = async () => {
    if (isLastStep) {
      if (onSubmit) {
        await onSubmit();
      }
    } else {
      await onNext();
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header con Stepper */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: { optional?: ReactNode } = {};
            if (step.optional) {
              labelProps.optional = (
                <Typography variant="caption" color="text.secondary">
                  Opcional
                </Typography>
              );
            }
            return (
              <Step
                key={step.label}
                {...stepProps}
                sx={{
                  cursor: canClickSteps && index < activeStep ? "pointer" : "default",
                }}
                onClick={() => {
                  if (canClickSteps && index < activeStep && onStepClick) {
                    onStepClick(index);
                  }
                }}
              >
                <StepLabel
                  {...labelProps}
                  StepIconComponent={
                    step.icon
                      ? () => (
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor:
                                index < activeStep
                                  ? "success.main"
                                  : index === activeStep
                                  ? "primary.main"
                                  : "action.disabledBackground",
                              color:
                                index <= activeStep ? "#ffffff" : "text.secondary",
                              boxShadow:
                                index === activeStep
                                  ? "0 0 0 4px rgba(26, 35, 126, 0.15)"
                                  : "none",
                              transition: "all 0.2s ease-in-out",
                            }}
                          >
                            {index < activeStep ? (
                              <CheckIcon sx={{ fontSize: 20 }} />
                            ) : (
                              step.icon
                            )}
                          </Box>
                        )
                      : undefined
                  }
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={index === activeStep ? 700 : 500}
                    color={index === activeStep ? "primary.main" : "text.primary"}
                  >
                    {step.label}
                  </Typography>
                  {step.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {step.description}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Contenido del paso actual */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ mb: 4 }}>{steps[activeStep]?.content}</Box>

        {/* Footer de navegación */}
        <Box>
          <Divider sx={{ mb: 3 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              disabled={activeStep === 0 || isSubmitting}
              onClick={onBack}
              startIcon={<ArrowBackIcon />}
              sx={{ px: 3, py: 1 }}
            >
              {backText}
            </Button>

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="contained"
                color={isLastStep ? "success" : "primary"}
                disabled={disableNext || isSubmitting}
                onClick={handleNextClick}
                endIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : isLastStep ? (
                    <CheckIcon />
                  ) : (
                    <ArrowForwardIcon />
                  )
                }
                sx={{
                  px: 3.5,
                  py: 1,
                  boxShadow: isLastStep
                    ? "0 4px 14px rgba(46, 125, 50, 0.3)"
                    : "0 4px 14px rgba(26, 35, 126, 0.25)",
                }}
              >
                {isSubmitting
                  ? "Procesando..."
                  : isLastStep
                  ? submitText
                  : nextText}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
