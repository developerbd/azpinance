import { View, Text, ViewProps } from 'react-native';

interface BadgeProps extends ViewProps {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
    children: React.ReactNode;
}

export function Badge({ children, variant = 'default', className, ...props }: BadgeProps) {
    let containerStyle = "self-start px-2 py-0.5 rounded-full border";
    let textStyle = "text-[10px] font-bold uppercase";

    switch (variant) {
        case 'secondary':
            containerStyle += " bg-secondary border-transparent";
            textStyle += " text-secondary-foreground";
            break;
        case 'destructive':
            containerStyle += " bg-red-50 border-red-200";
            textStyle += " text-red-700";
            break;
        case 'success':
            containerStyle += " bg-emerald-50 border-emerald-200";
            textStyle += " text-emerald-700";
            break;
        case 'warning':
            containerStyle += " bg-amber-50 border-amber-200";
            textStyle += " text-amber-700";
            break;
        case 'outline':
            containerStyle += " bg-transparent border-border";
            textStyle += " text-foreground";
            break;
        default: // Primary
            containerStyle += " bg-primary border-transparent";
            textStyle += " text-primary-foreground";
            break;
    }

    return (
        <View className={`${containerStyle} ${className || ''}`} {...props}>
            <Text className={textStyle}>{children}</Text>
        </View>
    );
}
