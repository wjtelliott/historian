BEGIN;

CREATE TABLE IF NOT EXISTS public.users (
    user_id serial NOT NULL,
    user_name character varying NOT NULL,
    user_discord_id character varying NOT NULL,
    user_discriminator character varying NOT NULL,
    user_is_bot boolean NOT NULL,
    user_avatar character varying,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    message_id bigserial NOT NULL,
    message_content character varying NOT NULL,
    message_timestamp character varying NOT NULL,
    message_channel_id character varying NOT NULL,
    user_id serial NOT NULL,
    PRIMARY KEY (message_id)
);

ALTER TABLE IF EXISTS public.messages
    ADD CONSTRAINT "UserID" FOREIGN KEY (user_id)
    REFERENCES public.users (user_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

END;