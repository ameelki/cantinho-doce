package lu.cantinho.shop.service;

import java.security.SecureRandom;

public final class CodeGenerator {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RND = new SecureRandom();

    private CodeGenerator() {}

    public static String next(String prefix) {
        StringBuilder sb = new StringBuilder(prefix);
        for (int i = 0; i < 6; i++) sb.append(ALPHABET.charAt(RND.nextInt(ALPHABET.length())));
        return sb.toString();
    }
}
