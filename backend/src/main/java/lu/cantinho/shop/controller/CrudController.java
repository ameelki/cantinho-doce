package lu.cantinho.shop.controller;

import lu.cantinho.shop.entity.BaseEntity;
import lu.cantinho.shop.service.Errors;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** CRUD générique réutilisé par les écrans de configuration de l'admin. */
public abstract class CrudController<T extends BaseEntity> {
    protected final JpaRepository<T, Long> repo;

    protected CrudController(JpaRepository<T, Long> repo) {
        this.repo = repo;
    }

    protected List<T> all() {
        return repo.findAll();
    }

    @GetMapping
    public List<T> list() {
        return all();
    }

    @PostMapping
    public T create(@RequestBody T body) {
        body.id = null;
        return repo.save(body);
    }

    @PutMapping("/{id}")
    public T update(@PathVariable Long id, @RequestBody T body) {
        if (!repo.existsById(id)) throw Errors.notFound("Élément introuvable.");
        body.id = id;
        return repo.save(body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
