"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const CampaignDialog = DialogPrimitive.Root
const CampaignDialogTrigger = DialogPrimitive.Trigger
const CampaignDialogPortal = DialogPrimitive.Portal
const CampaignDialogClose = DialogPrimitive.Close

const CampaignDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
CampaignDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

type ModalPosition = "center" | "top" | "bottom" | "left" | "right"

interface CampaignDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  position?: ModalPosition
}

const CampaignDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  CampaignDialogContentProps
>(({ className, children, position = "center", ...props }, ref) => {
  const getPositionClasses = (pos: ModalPosition) => {
    switch (pos) {
      case "top":
        return "fixed left-[50%] top-4 translate-x-[-50%] translate-y-0 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[-100%] data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[-100%]"
      case "bottom":
        return "fixed left-[50%] bottom-4 translate-x-[-50%] translate-y-0 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-bottom-[-100%] data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-bottom-[-100%]"
      case "left":
        return "fixed left-4 top-[50%] translate-x-0 translate-y-[-50%] data-[state=open]:slide-in-from-left-[-100%] data-[state=open]:slide-in-from-top-1/2 data-[state=closed]:slide-out-to-left-[-100%] data-[state=closed]:slide-out-to-top-1/2"
      case "right":
        return "fixed right-4 top-[50%] translate-x-0 translate-y-[-50%] data-[state=open]:slide-in-from-right-[-100%] data-[state=open]:slide-in-from-top-1/2 data-[state=closed]:slide-out-to-right-[-100%] data-[state=closed]:slide-out-to-top-1/2"
      default: // center
        return "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]"
    }
  }

  return (
    <CampaignDialogPortal>
      <CampaignDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
          getPositionClasses(position),
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </CampaignDialogPortal>
  )
})
CampaignDialogContent.displayName = DialogPrimitive.Content.displayName

const CampaignDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
CampaignDialogHeader.displayName = "CampaignDialogHeader"

const CampaignDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
CampaignDialogFooter.displayName = "CampaignDialogFooter"

const CampaignDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CampaignDialogTitle.displayName = DialogPrimitive.Title.displayName

const CampaignDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
CampaignDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  CampaignDialog,
  CampaignDialogPortal,
  CampaignDialogOverlay,
  CampaignDialogClose,
  CampaignDialogTrigger,
  CampaignDialogContent,
  CampaignDialogHeader,
  CampaignDialogFooter,
  CampaignDialogTitle,
  CampaignDialogDescription,
  type ModalPosition,
}
