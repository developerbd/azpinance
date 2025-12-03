-- Function to get forex statistics
CREATE OR REPLACE FUNCTION get_forex_stats()
RETURNS TABLE (
    today_volume_usd NUMERIC,
    month_volume_usd NUMERIC,
    month_volume_bdt NUMERIC,
    month_avg_rate NUMERIC,
    total_volume_usd NUMERIC,
    total_volume_bdt NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH 
    today_stats AS (
        SELECT COALESCE(SUM(amount), 0) as today_usd
        FROM forex_transactions
        WHERE transaction_date = CURRENT_DATE
    ),
    month_stats AS (
        SELECT 
            COALESCE(SUM(amount), 0) as month_usd,
            COALESCE(SUM(amount_bdt), 0) as month_bdt
        FROM forex_transactions
        WHERE date_trunc('month', transaction_date) = date_trunc('month', CURRENT_DATE)
    ),
    total_stats AS (
        SELECT 
            COALESCE(SUM(amount), 0) as total_usd,
            COALESCE(SUM(amount_bdt), 0) as total_bdt
        FROM forex_transactions
    )
    SELECT 
        today_stats.today_usd,
        month_stats.month_usd,
        month_stats.month_bdt,
        CASE 
            WHEN month_stats.month_usd > 0 THEN month_stats.month_bdt / month_stats.month_usd 
            ELSE 0 
        END as month_avg_rate,
        total_stats.total_usd,
        total_stats.total_bdt
    FROM today_stats, month_stats, total_stats;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_forex_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_forex_stats() TO service_role;
