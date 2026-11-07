package lu.cantinho.shop.repository;

import lu.cantinho.shop.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingRepository extends JpaRepository<Setting, String> {
}
