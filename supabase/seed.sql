-- ============================================================
-- Barefoot FC World Cup Match Predictor -- Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- Fixed UUIDs for matches (valid UUID v4 format)
-- Match 1-4: teams_pending (Round of 16)
-- Match 5-6: open (Quarter-final)
-- Match 7:   locked (Semi-final)
-- Match 8:   completed (Final, Argentina 2-1 France regulation)

INSERT INTO matches (id, match_number, round, team1_source, team2_source, team1_actual, team2_actual, match_date, prediction_deadline, status, manual_locked, team1_score, team2_score, winner, method)
VALUES
  (
    '11111111-1111-4111-8111-000000000001',
    1,
    'Round of 16',
    'Group A 1st',
    'Group B 2nd',
    NULL,
    NULL,
    NOW() + INTERVAL '20 days',
    NOW() + INTERVAL '19 days 23 hours',
    'teams_pending',
    FALSE,
    NULL, NULL, NULL, NULL
  ),
  (
    '11111111-1111-4111-8111-000000000002',
    2,
    'Round of 16',
    'Group C 1st',
    'Group D 2nd',
    NULL,
    NULL,
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '20 days 23 hours',
    'teams_pending',
    FALSE,
    NULL, NULL, NULL, NULL
  ),
  (
    '11111111-1111-4111-8111-000000000003',
    3,
    'Round of 16',
    'Group E 1st',
    'Group F 2nd',
    NULL,
    NULL,
    NOW() + INTERVAL '22 days',
    NOW() + INTERVAL '21 days 23 hours',
    'teams_pending',
    FALSE,
    NULL, NULL, NULL, NULL
  ),
  (
    '11111111-1111-4111-8111-000000000004',
    4,
    'Round of 16',
    'Group G 1st',
    'Group H 2nd',
    NULL,
    NULL,
    NOW() + INTERVAL '23 days',
    NOW() + INTERVAL '22 days 23 hours',
    'teams_pending',
    FALSE,
    NULL, NULL, NULL, NULL
  ),
  (
    '11111111-1111-4111-8111-000000000005',
    5,
    'Quarter-final',
    'W Match 1',
    'W Match 2',
    'Brazil',
    'Spain',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '29 days 23 hours',
    'open',
    FALSE,
    NULL, NULL, NULL, NULL
  ),
  (
    '11111111-1111-4111-8111-000000000006',
    6,
    'Quarter-final',
    'W Match 3',
    'W Match 4',
    'England',
    'Germany',
    NOW() + INTERVAL '31 days',
    NOW() + INTERVAL '30 days 23 hours',
    'open',
    FALSE,
    NULL, NULL, NULL, NULL
  ),
  (
    '11111111-1111-4111-8111-000000000007',
    7,
    'Semi-final',
    'W QF 1',
    'W QF 2',
    'Brazil',
    'England',
    NOW() + INTERVAL '37 days',
    NOW() - INTERVAL '1 hour',
    'locked',
    FALSE,
    NULL, NULL, NULL, NULL
  ),
  (
    '11111111-1111-4111-8111-000000000008',
    8,
    'Final',
    'W SF 1',
    'W SF 2',
    'Argentina',
    'France',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days',
    'completed',
    FALSE,
    2, 1, 'Argentina', 'regulation'
  );

-- Sample participants (valid UUID v4 format)
INSERT INTO participants (id, full_name, display_name, email, phone, city, country, favorite_team)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Carlos Mendez',
    'CarlosM',
    'carlos@example.com',
    '+1-555-0101',
    'Buenos Aires',
    'Argentina',
    'Argentina'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Sophie Laurent',
    'SophieL',
    'sophie@example.com',
    '+33-6-1234-5678',
    'Paris',
    'France',
    'France'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'James Walker',
    'JamesW',
    'james@example.com',
    NULL,
    'London',
    'England',
    'England'
  );

-- Sample predictions for the completed Final (match 8)
-- Carlos predicted Argentina 2-1 regulation (exact score, correct winner, correct method) => 3+1+3+1 = 8 pts
-- Sophie predicted France 1-0 regulation (wrong winner) => 0 pts
-- James predicted Argentina 1-0 regulation (correct winner, correct goal difference) => 3+1 = 4 pts

INSERT INTO predictions (participant_id, match_id, team1_score_predicted, team2_score_predicted, winner_predicted, method_predicted, points_awarded, correct_winner, exact_score, correct_goal_difference, correct_method)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-000000000008',
    2, 1, 'Argentina', 'regulation',
    8, TRUE, TRUE, TRUE, TRUE
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '11111111-1111-4111-8111-000000000008',
    1, 0, 'France', 'regulation',
    0, FALSE, FALSE, FALSE, FALSE
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '11111111-1111-4111-8111-000000000008',
    1, 0, 'Argentina', 'regulation',
    4, TRUE, FALSE, TRUE, TRUE
  );
