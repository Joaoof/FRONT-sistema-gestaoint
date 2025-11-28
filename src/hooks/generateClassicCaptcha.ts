export const generateClassicCaptcha = () => {
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 100
    const ctx = canvas.getContext("2d")

    if (!ctx) return { code: "", image: "" }

    // Background
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Generate random code
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    // Add noise lines
    ctx.strokeStyle = "#ddd"
    for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.stroke()
    }

    // Add noise dots
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`
        ctx.fillRect(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            2,
            2
        )
    }

    // Draw text with distortion
    ctx.font = "bold 40px Arial"
    ctx.fillStyle = "#333"
    ctx.textBaseline = "middle"

    const charWidth = canvas.width / code.length
    for (let i = 0; i < code.length; i++) {
        const x = charWidth * i + charWidth / 2
        const y = canvas.height / 2
        const angle = (Math.random() - 0.5) * 0.3

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillText(code[i], 0, 0)
        ctx.restore()
    }

    return {
        code,
        image: canvas.toDataURL()
    }
}