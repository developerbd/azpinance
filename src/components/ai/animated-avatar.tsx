import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AnimatedAvatarProps {
    size?: number;
    isAnimating?: boolean;
    className?: string;
}

export function AnimatedAvatar({ size = 32, isAnimating = false, className }: AnimatedAvatarProps) {
    return (
        <div className={cn("relative", className)} style={{ width: size, height: size }}>
            {/* Animated wave rings */}
            {isAnimating && (
                <>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 animate-ping" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 animate-pulse"
                        style={{ animationDelay: '0.15s' }} />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 animate-pulse"
                        style={{ animationDelay: '0.3s' }} />
                </>
            )}

            {/* Main avatar with glow */}
            <div className={cn(
                "relative rounded-full overflow-hidden",
                isAnimating && "ring-2 ring-blue-400/50 ring-offset-2 ring-offset-background"
            )}>
                <Image
                    src="/chatbot-avatar.png"
                    alt="AI Assistant"
                    width={size}
                    height={size}
                    className={cn(
                        "rounded-full transition-all duration-300",
                        isAnimating && "scale-105"
                    )}
                />

                {/* Gradient overlay when animating */}
                {isAnimating && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full animate-pulse" />
                )}
            </div>
        </div>
    );
}
