-- Function to get forex statistics with timezone support
CREATE OR REPLACE FUNCTION get_forex_stats()
RETURNS TABLE (
    today_volume_usd NUMERIC,
    month_volume_usd NUMERIC,
    month_volume_bdt NUMERIC,
    month_avg_rate NUMERIC,
    total_volume_usd NUMERIC,
    total_volume_bdt NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    app_timezone TEXT;
    app_today DATE;
    app_month_start DATE;
BEGIN
    -- Get the application timezone, default to UTC if not set
    SELECT timezone INTO app_timezone FROM system_settings LIMIT 1;
    IF app_timezone IS NULL THEN
        app_timezone := 'UTC';
    END IF;

    -- Calculate Today and Month Start in the application timezone
    -- now() is transaction_timestamp() (UTC). AT TIME ZONE converts to local wall time.
    app_today := (now() AT TIME ZONE app_timezone)::date;
    app_month_start := date_trunc('month', app_today);

    RETURN QUERY
    WITH 
    today_stats AS (
        SELECT COALESCE(SUM(amount), 0) as today_usd
        FROM forex_transactions
        WHERE transaction_date = app_today
    ),
    month_stats AS (
        SELECT 
            COALESCE(SUM(amount), 0) as month_usd,
            COALESCE(SUM(amount_bdt), 0) as month_bdt
        FROM forex_transactions
        WHERE transaction_date >= app_month_start 
          AND transaction_date < (app_month_start + INTERVAL '1 month')
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
