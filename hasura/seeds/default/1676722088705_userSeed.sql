SET
    check_function_bodies = false;

INSERT INTO
    public."user" (
        id,
        created_at,
        updated_at,
        email,
        team_id,
        world_id_nullifier,
        is_subscribed,
        ironclad_id
    )
VALUES
    (
        'usr_a78f59e547fa5bd3d76bc1a1817c6d89',
        '2023-02-18 10:44:58.085661+00',
        '2023-02-18 10:44:58.085661+00',
        'test@world.org',
        'team_d7cde14f17eda7e0ededba7ded6b4467',
        '0x123',
        false,
        'ironclad_123'
    );

INSERT INTO
    public."user" (
        id,
        created_at,
        updated_at,
        email,
        team_id,
        world_id_nullifier,
        is_subscribed,
        ironclad_id
    )
VALUES
    (
        'usr_a78f59e547fa5bd3d76bc1a1817c6d90',
        '2023-02-19 10:44:58.085661+00',
        '2023-02-19 10:44:58.085661+00',
        'test-admin@world.org',
        'team_d7cde14f17eda7e0ededba7ded6b4467',
        '0x1234',
        false,
        'ironclad_1234'
    );

INSERT INTO
    public."user" (
        id,
        created_at,
        updated_at,
        email,
        team_id,
        world_id_nullifier,
        is_subscribed,
        ironclad_id
    )
VALUES
    (
        'usr_a78f59e547fa5bd3d76bc1a1817c6d91',
        '2023-02-20 10:44:58.085661+00',
        '2023-02-20 10:44:58.085661+00',
        'test-member@world.org',
        'team_d7cde14f17eda7e0ededba7ded6b4467',
        '0x12345',
        false,
        'ironclad_12345'
    );

INSERT INTO
    public."user" (
        id,
        created_at,
        updated_at,
        email,
        team_id,
        world_id_nullifier,
        is_subscribed,
        ironclad_id
    )
VALUES
    (
        'usr_a78f59e547fa5bd3d76bc1a1817c6d92',
        '2023-02-18 10:44:58.085661+00',
        '2023-02-18 10:44:58.085661+00',
        'test1@team2.example.com',
        'team_2222214f17eda7e0ededba7ded6b4222',
        '0x123456',
        false,
        'ironclad_123456'
    );

INSERT INTO
    public."user" (
        id,
        created_at,
        updated_at,
        email,
        team_id,
        world_id_nullifier,
        is_subscribed,
        ironclad_id
    )
VALUES
    (
        'usr_a78f59e547fa5bd3d76bc1a1817c6d93',
        '2023-02-19 10:44:58.085661+00',
        '2023-02-19 10:44:58.085661+00',
        'test1-admin@team2.example.com',
        'team_2222214f17eda7e0ededba7ded6b4222',
        '0x1234567',
        false,
        'ironclad_1234567'
    );

INSERT INTO
    public."user" (
        id,
        created_at,
        updated_at,
        email,
        team_id,
        world_id_nullifier,
        is_subscribed,
        ironclad_id
    )
VALUES
    (
        'usr_a78f59e547fa5bd3d76bc1a1817c6d94',
        '2023-02-20 10:44:58.085661+00',
        '2023-02-20 10:44:58.085661+00',
        'test1-member@team2.example.com',
        'team_2222214f17eda7e0ededba7ded6b4222',
        '0x12345678',
        false,
        'ironclad_12345678'
    );