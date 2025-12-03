-- Function to get aggregated forex report data
CREATE OR REPLACE FUNCTION get_forex_report_data(
    p_start_date DATE, 
    p_end_date DATE,
    p_timezone TEXT DEFAULT 'UTC'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_daily_trend JSONB;
    v_contact_volume JSONB;
    v_status_breakdown JSONB;
    v_summary JSONB;
BEGIN
    -- 1. Daily Trend
    SELECT jsonb_agg(t) INTO v_daily_trend
    FROM (
        SELECT 
            (transaction_date)::text as date,
            SUM(amount) as volume_usd,
            SUM(amount_bdt) as volume_bdt,
            CASE WHEN SUM(amount) > 0 THEN SUM(amount_bdt) / SUM(amount) ELSE 0 END as avg_rate,
            COUNT(*) as tx_count
        FROM forex_transactions
        WHERE transaction_date BETWEEN p_start_date AND p_end_date
        GROUP BY transaction_date
        ORDER BY transaction_date
    ) t;

    -- 2. Volume by Contact
    SELECT jsonb_agg(t) INTO v_contact_volume
    FROM (
        SELECT 
            c.name as contact_name,
            SUM(ft.amount) as total_usd
        FROM forex_transactions ft
        LEFT JOIN contacts c ON ft.contact_id = c.id
        WHERE ft.transaction_date BETWEEN p_start_date AND p_end_date
        GROUP BY c.name
        ORDER BY total_usd DESC
        LIMIT 10
    ) t;

    -- 3. Status Breakdown
    SELECT jsonb_agg(t) INTO v_status_breakdown
    FROM (
        SELECT 
            status,
            COUNT(*) as count,
            SUM(amount) as total_usd
        FROM forex_transactions
        WHERE transaction_date BETWEEN p_start_date AND p_end_date
        GROUP BY status
    ) t;

    -- 4. Summary Stats
    SELECT jsonb_build_object(
        'total_volume_usd', COALESCE(SUM(amount), 0),
        'total_volume_bdt', COALESCE(SUM(amount_bdt), 0),
        'avg_rate', CASE WHEN SUM(amount) > 0 THEN SUM(amount_bdt) / SUM(amount) ELSE 0 END,
        'total_count', COUNT(*)
    ) INTO v_summary
    FROM forex_transactions
    WHERE transaction_date BETWEEN p_start_date AND p_end_date;

    -- Combine all into one JSON object
    RETURN jsonb_build_object(
        'daily_trend', COALESCE(v_daily_trend, '[]'::jsonb),
        'contact_volume', COALESCE(v_contact_volume, '[]'::jsonb),
        'status_breakdown', COALESCE(v_status_breakdown, '[]'::jsonb),
        'summary', v_summary
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_forex_report_data(DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_forex_report_data(DATE, DATE, TEXT) TO service_role;
