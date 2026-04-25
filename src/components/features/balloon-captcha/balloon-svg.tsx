interface BalloonSvgProps {
	color: string;
	size?: number;
	label?: string;
	className?: string;
	style?: React.CSSProperties;
}

export function BalloonSvg({ color, size = 40, label, className, style }: BalloonSvgProps) {
	return (
		<svg
			width={size}
			height={size * 2}
			viewBox="0 0 40 80"
			fill="none"
			className={className}
			style={style}
		>
			{/* Body */}
			<ellipse cx="20" cy="22" rx="17" ry="22" fill={color} />
			{/* Shine */}
			<ellipse
				cx="13"
				cy="15"
				rx="4"
				ry="6"
				fill="white"
				opacity="0.4"
				transform="rotate(-15 13 15)"
			/>
			{/* Label */}
			{label && (
				<text
					x="20"
					y="27"
					textAnchor="middle"
					fill="white"
					fontSize="16"
					fontWeight="bold"
					fontFamily="sans-serif"
					style={{ userSelect: "none" }}
				>
					{label}
				</text>
			)}
			{/* Knot */}
			<polygon points="18,44 22,44 20,47" fill={color} />
			{/* String */}
			<path
				d="M20 47 Q22 58 19 68 Q17 75 20 80"
				stroke={color}
				strokeWidth="1"
				fill="none"
				opacity="0.6"
			/>
		</svg>
	);
}
