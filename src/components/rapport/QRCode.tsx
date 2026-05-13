'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeProps {
  url: string
  size?: number
}

export function QRCode({ url, size = 120 }: QRCodeProps) {
  return (
    <div className="inline-block p-3 bg-white rounded-lg border border-foreground/10">
      <QRCodeSVG value={url} size={size} level="M" />
    </div>
  )
}
